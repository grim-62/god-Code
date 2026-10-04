const Problem = require('../models/Problem')
const Submission = require('../models/Submission')

const listFields = '-testCases -driverCode'
const editableFields = [
  'title',
  'difficulty',
  'tags',
  'description',
  'constraints',
  'examples',
  'starterCode',
  'driverCode',
  'testCases',
  'timeLimit',
  'memoryLimit',
]

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getProblemUpdates(body) {
  return editableFields.reduce((updates, field) => {
    if (body[field] !== undefined) updates[field] = body[field]
    return updates
  }, {})
}

async function listProblems(request, response) {
  const page = Number(request.query.page || 1)
  const limit = Number(request.query.limit || 20)
  const filter = {}

  if (request.query.search) {
    filter.title = { $regex: escapeRegex(request.query.search.trim()), $options: 'i' }
  }
  if (request.query.difficulty) filter.difficulty = request.query.difficulty
  if (request.query.tag) {
    filter.tags = { $regex: `^${escapeRegex(request.query.tag.trim())}$`, $options: 'i' }
  }

  const [problems, total, tags, solvedProblemIds] = await Promise.all([
    Problem.find(filter, listFields)
      .sort({ createdAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Problem.countDocuments(filter),
    Problem.distinct('tags'),
    request.user
      ? Submission.distinct('problem', { user: request.user._id, verdict: 'Accepted' })
      : Promise.resolve([]),
  ])
  const solvedIds = new Set(solvedProblemIds.map((id) => id.toString()))

  return response.status(200).json({
    problems: problems.map((problem) => ({
      ...problem,
      solved: solvedIds.has(problem._id.toString()),
    })),
    tags: tags.filter(Boolean).sort((left, right) => left.localeCompare(right)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

async function getProblemBySlug(request, response) {
  const problem = await Problem.findOne({ slug: request.params.slug }).select('-driverCode').lean()

  if (!problem) {
    return response.status(404).json({ message: 'Problem not found.' })
  }

  const samples = (problem.testCases || [])
    .filter((testCase) => !testCase.isHidden)
    .map(({ input, expectedOutput }) => ({ input, expectedOutput }))
  delete problem.testCases

  return response.status(200).json({ problem: { ...problem, samples } })
}

async function getProblemById(request, response) {
  const problem = await Problem.findById(request.params.id).lean()

  if (!problem) {
    return response.status(404).json({ message: 'Problem not found.' })
  }

  return response.status(200).json({ problem })
}

async function createProblem(request, response) {
  try {
    const problem = await Problem.create({
      ...getProblemUpdates(request.body),
      createdBy: request.user._id,
    })

    return response.status(201).json({ problem: problem.toObject() })
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: 'A problem with this title already exists.' })
    }
    throw error
  }
}

async function updateProblem(request, response) {
  const problem = await Problem.findById(request.params.id)

  if (!problem) {
    return response.status(404).json({ message: 'Problem not found.' })
  }

  Object.assign(problem, getProblemUpdates(request.body))

  try {
    await problem.save()
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: 'A problem with this title already exists.' })
    }
    throw error
  }

  return response.status(200).json({ problem: problem.toObject() })
}

async function deleteProblem(request, response) {
  const problem = await Problem.findByIdAndDelete(request.params.id)

  if (!problem) {
    return response.status(404).json({ message: 'Problem not found.' })
  }

  return response.status(200).json({ message: 'Problem deleted.' })
}

module.exports = { createProblem, deleteProblem, getProblemById, getProblemBySlug, listProblems, updateProblem }