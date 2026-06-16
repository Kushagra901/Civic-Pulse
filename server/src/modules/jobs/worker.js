import { Worker } from "bullmq";
import { redis } from "../../config/redis.js";
import { recalculateScores, updateUserTrustScore } from "./scoring.js";

const worker = new Worker(
  "incidentQueue",
  async (job) => {
    if (job.name === "recalculateScores") {
      await recalculateScores(job.data.incidentId);
      if (job.data.userId) {
        await updateUserTrustScore(job.data.userId);
      }
    }
  },
  { connection: redis }
);

worker.on("completed", (job) => console.log("✅ Job done", job.id, job.name));
worker.on("failed", (job, err) => console.error("❌ Job failed", job?.id, job?.name, err));
