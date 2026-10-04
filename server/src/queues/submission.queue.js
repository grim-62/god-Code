const { Queue } = require('bullmq')
const { createRedisConnection } = require('../config/redis')

const SUBMISSION_QUEUE_NAME = 'submission-judging'
let submissionQueue

function getSubmissionQueue() {
  if (!submissionQueue) {
    submissionQueue = new Queue(SUBMISSION_QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 1000 },
        removeOnComplete: 500,
        removeOnFail: 1000,
      },
    })
  }

  return submissionQueue
}

module.exports = { getSubmissionQueue, SUBMISSION_QUEUE_NAME }