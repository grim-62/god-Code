const Problem = require('../models/Problem')
const Submission = require('../models/Submission')
const { LANGUAGE_IDS, runCode } = require('../utils/judge0')

const verdictByStatusId = {
  3: 'Accepted',
  4: 'Wrong Answer',
  5: 'Time Limit Exceeded',
  6: 'Compilation Error',
}

function normalizeOutput(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').trim()
}

function toRuntimeMs(time) {
  const seconds = Number.parseFloat(time)
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0
}

function publicFailure(testCase, actual, error) {
  if (testCase.isHidden) return undefined
  return {
    input: testCase.input,
    expected: testCase.expectedOutput,
    actual,
    ...(error ? { error } : {}),
  }
}

async function setFinalResult(submissionId, update) {
  await Submission.updateOne({ _id: submissionId }, { $set: update })
}

async function processSubmission(job) {
  const { submissionId } = job.data
  const submission = await Submission.findById(submissionId).select('+code')
  if (!submission || submission.verdict !== 'Pending') return

  const problem = await Problem.findById(submission.problem)
    .select('driverCode testCases timeLimit memoryLimit')
    .lean()

  if (!problem) {
    await setFinalResult(submissionId, { verdict: 'Runtime Error' })
    return
  }

  const driverTemplate = problem.driverCode?.[submission.language]
  if (!driverTemplate?.includes('{{USER_CODE}}')) {
    await setFinalResult(submissionId, { verdict: 'Runtime Error' })
    return
  }

  const sourceCode = driverTemplate.replaceAll('{{USER_CODE}}', submission.code)
  const testCases = problem.testCases || []
  let passed = 0
  let runtimeMs = 0
  let memoryKb = 0
  let verdict = 'Accepted'
  let failedCase

  for (const testCase of testCases) {
    let execution
    try {
      execution = await runCode({
        sourceCode,
        languageId: LANGUAGE_IDS[submission.language],
        stdin: testCase.input,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
      })
    } catch (error) {
      verdict = 'Runtime Error'
      failedCase = publicFailure(testCase, '', error.message)
      break
    }

    runtimeMs += toRuntimeMs(execution.time)
    memoryKb = Math.max(memoryKb, Number(execution.memory) || 0)

    if (execution.statusId !== 3) {
      verdict = verdictByStatusId[execution.statusId] || 'Runtime Error'
      failedCase = publicFailure(
        testCase,
        execution.stdout,
        execution.compileOutput || execution.stderr || execution.statusDescription,
      )
      break
    }

    if (normalizeOutput(execution.stdout) !== normalizeOutput(testCase.expectedOutput)) {
      verdict = 'Wrong Answer'
      failedCase = publicFailure(testCase, execution.stdout, '')
      break
    }

    passed += 1
    await setFinalResult(submissionId, { passed, runtimeMs, memoryKb })
  }

  await setFinalResult(submissionId, {
    verdict,
    passed,
    runtimeMs,
    memoryKb,
    ...(failedCase ? { failedCase } : {}),
  })
}

module.exports = { processSubmission }