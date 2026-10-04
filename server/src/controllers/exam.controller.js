const Exam = require('../models/Exam')
const Problem = require('../models/Problem')
const Submission = require('../models/Submission')

const editableFields = ['title', 'problems', 'startTime', 'endTime', 'duration']

function getExamUpdates(body) {
  return editableFields.reduce((updates, field) => {
    if (body[field] !== undefined) updates[field] = body[field]
    return updates
  }, {})
}

async function validateExamProblems(problems) {
  const problemIds = problems.map((entry) => entry.problem.toString())
  const uniqueIds = new Set(problemIds)
  if (uniqueIds.size !== problemIds.length) return false
  return (await Problem.countDocuments({ _id: { $in: [...uniqueIds] } })) === uniqueIds.size
}

function publicExam(exam, userId) {
  const result = exam.toObject ? exam.toObject() : { ...exam }
  const participant = result.participants?.find((entry) => entry.user.toString() === userId?.toString())
  delete result.participants

  return {
    exam: result,
    participant: participant ? {
      startedAt: participant.startedAt,
      endsAt: participant.endsAt,
      violationCount: participant.violations?.length || 0,
    } : null,
  }
}

async function listExams(_request, response) {
  const exams = await Exam.find()
    .select('title problems startTime endTime duration')
    .populate('problems.problem', 'title slug difficulty')
    .sort({ startTime: 1 })
    .lean()

  return response.status(200).json({ exams })
}

async function getExam(request, response) {
  const exam = await Exam.findById(request.params.id)
    .populate('problems.problem', 'title slug difficulty tags description constraints examples starterCode')

  if (!exam) return response.status(404).json({ message: 'Exam not found.' })
  return response.status(200).json({
    ...publicExam(exam, request.user?._id),
    serverTime: new Date(),
  })
}

async function createExam(request, response) {
  if (new Date(request.body.endTime).getTime() <= new Date(request.body.startTime).getTime()) {
    return response.status(400).json({ message: 'Exam end time must be after its start time.' })
  }
  if (!(await validateExamProblems(request.body.problems))) {
    return response.status(400).json({ message: 'Exam problems must be valid and unique.' })
  }

  const exam = await Exam.create({
    ...getExamUpdates(request.body),
    createdBy: request.user._id,
  })
  return response.status(201).json({ exam })
}

async function updateExam(request, response) {
  const exam = await Exam.findById(request.params.id)
  if (!exam) return response.status(404).json({ message: 'Exam not found.' })
  if (exam.participants.length > 0) {
    return response.status(409).json({ message: 'An exam cannot be changed after a participant has started it.' })
  }

  Object.assign(exam, getExamUpdates(request.body))
  if (exam.endTime <= exam.startTime) {
    return response.status(400).json({ message: 'Exam end time must be after its start time.' })
  }
  if (!(await validateExamProblems(exam.problems))) {
    return response.status(400).json({ message: 'Exam problems must be valid and unique.' })
  }
  await exam.save()

  return response.status(200).json({ exam })
}

async function deleteExam(request, response) {
  const exam = await Exam.findById(request.params.id)
  if (!exam) return response.status(404).json({ message: 'Exam not found.' })
  if (exam.participants.length > 0) {
    return response.status(409).json({ message: 'An exam cannot be deleted after a participant has started it.' })
  }
  await exam.deleteOne()
  return response.status(200).json({ message: 'Exam deleted.' })
}

async function startExam(request, response) {
  const exam = await Exam.findById(request.params.id)
  if (!exam) return response.status(404).json({ message: 'Exam not found.' })

  const now = new Date()
  let participant = exam.participants.find((entry) => entry.user.toString() === request.user._id.toString())

  if (!participant) {
    if (now < exam.startTime) return response.status(409).json({ message: 'This exam has not started yet.' })
    if (now >= exam.endTime) return response.status(409).json({ message: 'This exam has ended.' })

    const personalEndTime = new Date(Math.min(
      now.getTime() + exam.duration * 60_000,
      exam.endTime.getTime(),
    ))
    exam.participants.push({
      user: request.user._id,
      startedAt: now,
      endsAt: personalEndTime,
      violations: [],
    })
    await exam.save()
    participant = exam.participants.find((entry) => entry.user.toString() === request.user._id.toString())
  }

  return response.status(200).json({
    startedAt: participant.startedAt,
    endsAt: participant.endsAt,
    serverTime: now,
  })
}

async function logViolation(request, response) {
  const exam = await Exam.findById(request.params.id)
  if (!exam) return response.status(404).json({ message: 'Exam not found.' })

  const participant = exam.participants.find((entry) => entry.user.toString() === request.user._id.toString())
  if (!participant) return response.status(403).json({ message: 'Start this exam before logging violations.' })
  if (Date.now() >= participant.endsAt.getTime()) {
    return response.status(409).json({ message: 'Your exam time has ended.' })
  }

  participant.violations.push({ type: request.body.type, occurredAt: new Date() })
  await exam.save()

  return response.status(201).json({ violationCount: participant.violations.length })
}

async function getLeaderboard(request, response) {
  const exam = await Exam.findById(request.params.id)
    .populate('participants.user', 'name')
    .lean()
  if (!exam) return response.status(404).json({ message: 'Exam not found.' })

  const leaderboard = await buildLeaderboard(exam)

  return response.status(200).json({
    leaderboard: leaderboard.map((entry, index) => ({ rank: index + 1, ...entry })),
  })
}

async function getExamResults(request, response) {
  const exam = await Exam.findById(request.params.id)
    .populate('participants.user', 'name email')
    .lean()
  if (!exam) return response.status(404).json({ message: 'Exam not found.' })

  const { leaderboard } = await getLeaderboardData(exam)
  const results = (exam.participants || []).map((participant) => {
    const userId = (participant.user._id || participant.user).toString()
    const score = leaderboard.find((entry) => entry.userId === userId)
    return {
      user: participant.user,
      startedAt: participant.startedAt,
      endsAt: participant.endsAt,
      violationCount: participant.violations.length,
      violations: participant.violations,
      score: score?.score || 0,
      solved: score?.solved || 0,
      tieBreakTimeMs: score?.tieBreakTimeMs || 0,
    }
  }).sort((left, right) => right.score - left.score || left.tieBreakTimeMs - right.tieBreakTimeMs)

  return response.status(200).json({ results })
}

async function getLeaderboardData(exam) {
  const participants = exam.participants || []
  const acceptedSubmissions = await Submission.find({
    exam: exam._id,
    verdict: 'Accepted',
    user: { $in: participants.map((participant) => participant.user._id || participant.user) },
    problem: { $in: exam.problems.map((entry) => entry.problem) },
  }).sort({ createdAt: 1 }).select('user problem createdAt').lean()

  const marks = new Map(exam.problems.map(({ problem, marks: value }) => [problem.toString(), value]))
  const solves = new Map()
  for (const submission of acceptedSubmissions) {
    const userId = submission.user.toString()
    const problemId = submission.problem.toString()
    const key = `${userId}:${problemId}`
    if (!solves.has(key)) solves.set(key, submission.createdAt)
  }

  const leaderboard = participants.map((participant) => {
    const userId = (participant.user._id || participant.user).toString()
    let score = 0
    let solved = 0
    let tieBreakTimeMs = 0
    for (const [problemId, problemMarks] of marks) {
      const solvedAt = solves.get(`${userId}:${problemId}`)
      if (!solvedAt) continue
      const solveTime = new Date(solvedAt).getTime()
      if (solveTime < new Date(participant.startedAt).getTime() || solveTime > new Date(participant.endsAt).getTime()) continue
      score += problemMarks
      solved += 1
      tieBreakTimeMs = Math.max(
        tieBreakTimeMs,
        solveTime - new Date(participant.startedAt).getTime(),
      )
    }
    return { userId, score, solved, tieBreakTimeMs }
  })

  return { leaderboard }
}

module.exports = {
  createExam,
  deleteExam,
  getExam,
  getExamResults,
  getLeaderboard,
  listExams,
  logViolation,
  startExam,
  updateExam,
}

async function buildLeaderboard(exam) {
  const { leaderboard } = await getLeaderboardData(exam)
  return leaderboard.map((entry) => {
    const participant = exam.participants.find((item) => (item.user._id || item.user).toString() === entry.userId)
    return { ...entry, name: participant?.user?.name || 'Participant' }
  }).sort((left, right) => right.score - left.score || left.tieBreakTimeMs - right.tieBreakTimeMs)
}