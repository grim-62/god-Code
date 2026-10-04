require('../config/env')

const mongoose = require('mongoose')
const { Worker } = require('bullmq')
const { createRedisConnection } = require('../config/redis')
const { processSubmission } = require('../services/submission.service')
const { SUBMISSION_QUEUE_NAME } = require('../queues/submission.queue')

async function startWorker() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set')
  }

  await mongoose.connect(process.env.MONGODB_URI)
  const worker = new Worker(SUBMISSION_QUEUE_NAME, processSubmission, {
    connection: createRedisConnection(),
    concurrency: 2,
    lockDuration: 300_000,
  })

  worker.on('completed', (job) => console.log(`Judged submission ${job.data.submissionId}`))
  worker.on('failed', (job, error) => console.error(`Submission job ${job?.id} failed:`, error.message))
  worker.on('error', (error) => console.error('Submission worker error:', error.message))
  console.log('Submission worker is listening for jobs')

  const shutdown = async () => {
    await worker.close()
    await mongoose.disconnect()
    process.exit(0)
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

startWorker().catch((error) => {
  console.error('Failed to start submission worker:', error.message)
  process.exitCode = 1
})