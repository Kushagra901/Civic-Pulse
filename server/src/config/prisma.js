import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  log: env.NODE_ENV === "development"
    ? [{ level: "query", emit: "event" }]
    : [],
});

if (env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    if (e.duration > 100) {
      console.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

