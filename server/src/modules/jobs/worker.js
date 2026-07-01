import { Worker } from "bullmq";
import { redis } from "../../config/redis.js";
import { recalculateScores, updateUserTrustScore } from "./scoring.js";
import { env } from "../../config/env.js";
import logger from "../../config/logger.js";

const log = logger.child({ module: "scoringWorker" });

const worker = new Worker(
  "incidentQueue",
  async (job) => {
    const log_job = log.child({ jobId: job.id, jobName: job.name });
    log_job.info({ data: job.data }, "Processing job");

    try {
      if (job.name === "recalculateScores") {
        await recalculateScores(job.data.incidentId);
        if (job.data.userId) {
          await updateUserTrustScore(job.data.userId);
        }
      }
      log_job.info("Job completed");
    } catch (err) {
      log_job.error({ err, data: job.data }, "Job failed");
      throw err;
    }
  },
  { connection: redis, concurrency: env.QUEUE_CONCURRENCY }
);

worker.on("failed", (job, err) => {
  log.error({ jobId: job?.id, err }, "Worker reported job failure");
});

worker.on("error", (err) => {
  log.fatal({ err }, "BullMQ worker encountered a fatal error");
});

export default worker;

