import { Queue } from "bullmq";
import { redis } from "../../config/redis.js";

export const incidentQueue = new Queue("incidentQueue", { connection: redis });
