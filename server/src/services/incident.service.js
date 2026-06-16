const CLUSTER_RADIUS = 250; // meters

const nearby = await prisma.$queryRawUnsafe(`
  SELECT id FROM "Incident"
  WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
    ${CLUSTER_RADIUS}
  )
  LIMIT 1;
`);
