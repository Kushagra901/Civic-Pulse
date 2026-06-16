
import { prisma } from "../src/config/prisma.js";
import { createOrAttachIncident, listIncidentsNear } from "../src/modules/incidents/incidents.service.js";

async function main() {
    console.log("Starting Geo-Spatial Verification...");

    // Cleanup test data if possible? Or just make new unique ones?
    // Let's use specific category "TEST_GEO" to easily identify/ignore.
    // Although the auto-clustering logic filters by category, so it won't mix with real data.

    const userId = (await prisma.user.findFirst())?.id;
    if (!userId) {
        console.error("No user found in DB to use as creator.");
        process.exit(1);
    }

    const category = "TEST_GEO_" + Date.now();

    console.log(`\n1. Creating Incident A (New York) - Category: ${category}`);
    const incidentA = await createOrAttachIncident({
        userId,
        title: "Pothole on Broadway",
        category,
        description: "Big pothole",
        lat: 40.7128,
        lng: -74.0060
    });
    console.log("Incident A created:", incidentA.id, incidentA.title);

    console.log(`\n2. Searching Near NY (Radius 1km)`);
    const nearNY = await listIncidentsNear({
        lat: 40.7128,
        lng: -74.0060,
        radiusKm: 1,
        category
    });
    console.log(`Found ${nearNY.length} incidents near NY.`);
    if (nearNY.length === 1 && nearNY[0].id === incidentA.id) {
        console.log("PASS: Found Incident A.");
    } else {
        console.error("FAIL: Did not find Incident A correctly.", nearNY);
    }

    console.log(`\n3. Creating Incident B (Very close to NY) - Should Attach`);
    const incidentB = await createOrAttachIncident({
        userId,
        title: "Another report of pothole",
        category,
        description: "Same pothole I think",
        lat: 40.7129, // slightly different
        lng: -74.0061
    });
    console.log("Result for Incident B:", incidentB.id);

    if (incidentB.id === incidentA.id) {
        console.log("PASS: Incident B attached to Incident A.");
    } else {
        console.error("FAIL: Incident B created a NEW incident instead of attaching!", incidentB.id);
    }

    console.log(`\n4. Creating Incident C (Los Angeles) - Should be NEW`);
    const incidentC = await createOrAttachIncident({
        userId,
        title: "Traffic Light Broken",
        category,
        description: "Sunset Blvd",
        lat: 34.0522,
        lng: -118.2437
    });
    console.log("Incident C created:", incidentC.id);

    if (incidentC.id !== incidentA.id) {
        console.log("PASS: Incident C is a fresh incident.");
    } else {
        console.error("FAIL: Incident C attached to Incident A??? (Distance check fail)");
    }

    console.log(`\n5. Final Search verifying counts`);
    const verifyNY = await listIncidentsNear({
        lat: 40.7128,
        lng: -74.0060,
        radiusKm: 5,
        category
    });

    // Incident A should have 2 reports? 
    // currently listIncidentsNear returns report_count
    const foundA = verifyNY.find(i => i.id === incidentA.id);
    if (foundA) {
        console.log(`Incident A Report Count: ${foundA.report_count}`);
        // We created A (1 report) + B (1 report) = 2
        if (Number(foundA.report_count) >= 2) {
            console.log("PASS: Report count incremented.");
        } else {
            console.log("WARN: Report count look wrong? " + foundA.report_count);
        }
    }

    console.log("\nDone.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        // Force exit if queue handles hang
        process.exit(0);
    });
