const Problem = require('../models/Problem')
const Submission = require('../models/Submission')

const difficulties = ['Easy', 'Medium', 'Hard']

function emptyDifficultyCounts() {
  return { Easy: 0, Medium: 0, Hard: 0 }
}

async function getMyStats(request, response) {
  const userId = request.user._id
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const firstDay = new Date(today)
  firstDay.setUTCDate(firstDay.getUTCDate() - 364)
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

  const [solvedRows, availableRows, totalSubmissions, acceptedSubmissions, dailyRows, recentSubmissions] = await Promise.all([
    Submission.aggregate([
      { $match: { user: userId, verdict: 'Accepted' } },
      { $group: { _id: '$problem' } },
      {
        $lookup: {
          from: Problem.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'problem',
        },
      },
      { $unwind: '$problem' },
      { $group: { _id: '$problem.difficulty', count: { $sum: 1 } } },
    ]),
    Problem.aggregate([{ $group: { _id: '$difficulty', count: { $sum: 1 } } }]),
    Submission.countDocuments({ user: userId }),
    Submission.countDocuments({ user: userId, verdict: 'Accepted' }),
    Submission.aggregate([
      { $match: { user: userId, createdAt: { $gte: firstDay, $lt: tomorrow } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          count: { $sum: 1 },
        },
      },
    ]),
    Submission.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('problem language verdict runtimeMs memoryKb passed total createdAt')
      .populate('problem', 'title slug difficulty')
      .lean(),
  ])

  const solvedByDifficulty = emptyDifficultyCounts()
  const availableByDifficulty = emptyDifficultyCounts()
  for (const row of solvedRows) {
    if (difficulties.includes(row._id)) solvedByDifficulty[row._id] = row.count
  }
  for (const row of availableRows) {
    if (difficulties.includes(row._id)) availableByDifficulty[row._id] = row.count
  }

  const dailyCountMap = new Map(dailyRows.map((row) => [row._id, row.count]))
  const dailySubmissionCounts = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(firstDay)
    date.setUTCDate(date.getUTCDate() + index)
    const key = date.toISOString().slice(0, 10)
    return { date: key, count: dailyCountMap.get(key) || 0 }
  })

  const totalSolved = Object.values(solvedByDifficulty).reduce((sum, count) => sum + count, 0)
  const acceptanceRate = totalSubmissions
    ? Math.round((acceptedSubmissions / totalSubmissions) * 1000) / 10
    : 0

  return response.status(200).json({
    totalSolved,
    solvedByDifficulty,
    availableByDifficulty,
    totalSubmissions,
    acceptanceRate,
    dailySubmissionCounts,
    recentSubmissions,
  })
}

module.exports = { getMyStats }