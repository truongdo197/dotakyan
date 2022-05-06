import { updateMemberGeolocation } from '$app/services/member';
import { Queue, Worker, QueueEvents } from 'bullmq';
import log from '$helpers/log';
const logger = log('Queue');

/**
 * Update
 */
export const UpdateGeolocation = new Queue('Update-Geolocation', {
  connection: {
    host: '127.0.0.1',
    port: 6379,
  },
  defaultJobOptions: {
    attempts: 3,
  },
});

export const UpdateGeolocationWorker = new Worker('Update-Geolocation', async (job) => {
  if (job.name === 'Update-Geolocation') {
    await updateMemberGeolocation(job.data.memberId, job.data.data);
  }
});

const UpdateGeolocationEvents = new QueueEvents('Update-Geolocation');

// UpdateGeolocationEvents.on('completed', (job) => {
//   logger.mark(`[Update-Geolocation] - JobId: ${job.jobId} completed.\n`);
// });

UpdateGeolocationEvents.on('failed', (job) => {
  logger.error(`[Update-Geolocation] - JobId: ${job.jobId} failed.\n Reason: ${job.failedReason}\n`);
});
