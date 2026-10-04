const Problem = require('../models/Problem')
const Exam = require('../models/Exam')
const Submission = require('../models/Submission')
const { getSubmissionQueue } = require('../queues/submission.queue')
const { LANGUAGE_IDS } = require('../utils/judge0')

function toClientSubmission(submission) {
  const result = submission.toObject ? submission.toObject() : { ...submission }
  delete result.code
  return result
}

async function createSubmission(request, response) {
  const { problemId, language, code, examId } = request.body
  const problem = await Problem.findById(problemId).select('driverCode testCases')

  if (!problem) {
    return response.status(404).json({ message: 'Problem not found.' })
  }

  if (!problem.testCases?.length) {
    return response.status(400).json({ message: 'This problem has no test cases configured.' })
  }

  const driverTemplate = problem.driverCode?.[language]
  if (!driverTemplate?.includes('{{USER_CODE}}')) {
    return response.status(400).json({ message: `Driver code for ${language} must include the {{USER_CODE}} placeholder.` })
  }

  if (!LANGUAGE_IDS[language]) {
    return response.status(400).json({ message: 'Language is not supported.' })
  }

  let exam
  if (examId) {
    exam = await Exam.findById(examId).select('problems participants')
    if (!exam) return response.status(404).json({ message: 'Exam not found.' })

    const participant = exam.participants.find((entry) => entry.user.toString() === request.user._id.toString())
    if (!participant) return response.status(403).json({ message: 'Start this exam before submitting.' })
    if (Date.now() >= participant.endsAt.getTime()) {
      return response.status(409).json({ message: 'Your exam time has ended.' })
    }
    if (!exam.problems.some((entry) => entry.problem.toString() === problemId)) {
      return response.status(400).json({ message: 'This problem is not part of the exam.' })
    }
  }

  const submission = await Submission.create({
    user: request.user._id,
    problem: problem._id,
    ...(exam ? { exam: exam._id } : {}),
    language,
    code,
    verdict: 'Pending',
    total: problem.testCases.length,
  })

  try {
    await getSubmissionQueue().add('judge-submission', {
      submissionId: submission._id.toString(),
    }, {
      jobId: `submission-${submission._id}`,
    })
  } catch (_error) {
    await Submission.deleteOne({ _id: submission._id })
    return response.status(503).json({ message: 'Submission queue is unavailable. Please try again shortly.' })
  }

  return response.status(202).json({ submission: toClientSubmission(submission) })
}

async function getSubmission(request, response) {
  const submission = await Submission.findById(request.params.id).select('-code').lean()

  if (!submission) {
    return response.status(404).json({ message: 'Submission not found.' })
  }

  const isOwner = submission.user.toString() === request.user._id.toString()
  if (!isOwner && request.user.role !== 'admin') {
    return response.status(403).json({ message: 'You cannot view this submission.' })
  }

  return response.status(200).json({ submission })
}

async function listProblemSubmissions(request, response) {
  const submissions = await Submission.find({
    user: request.user._id,
    problem: request.query.problemId,
  })
    .select('+code')
    .sort({ createdAt: -1 })
    .lean()

  return response.status(200).json({ submissions })
}

module.exports = { createSubmission, getSubmission, listProblemSubmissions }