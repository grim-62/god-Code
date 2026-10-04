const Problem = require('../models/Problem')
const { LANGUAGE_IDS, runCode } = require('../utils/judge0')

function comparableOutput(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').trim()
}

function getExecutionError(result) {
  if (result.compileOutput.trim()) return result.compileOutput.trim()
  if (result.stderr.trim()) return result.stderr.trim()
  if (result.statusId !== 3) return result.statusDescription
  return null
}

async function runProblem(request, response) {
  const { problemId, language, code } = request.body
  const problem = await Problem.findById(problemId).select('driverCode testCases timeLimit memoryLimit').lean()

  if (!problem) {
    return response.status(404).json({ message: 'Problem not found.' })
  }

  const driverTemplate = problem.driverCode?.[language]
  if (!driverTemplate || !driverTemplate.includes('{{USER_CODE}}')) {
    return response.status(400).json({
      message: `Driver code for ${language} must include the {{USER_CODE}} placeholder.`,
    })
  }

  const sampleCases = (problem.testCases || []).filter((testCase) => !testCase.isHidden)
  const sourceCode = driverTemplate.replaceAll('{{USER_CODE}}', code)
  const results = []

  for (const testCase of sampleCases) {
    try {
      const execution = await runCode({
        sourceCode,
        languageId: LANGUAGE_IDS[language],
        stdin: testCase.input,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
      })
      const error = getExecutionError(execution)
      const actual = execution.stdout

      results.push({
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual,
        passed: !error && comparableOutput(actual) === comparableOutput(testCase.expectedOutput),
        time: execution.time,
        memory: execution.memory,
        error,
        statusId: execution.statusId,
        statusDescription: execution.statusDescription,
        stderr: execution.stderr,
        compileOutput: execution.compileOutput,
      })
    } catch (error) {
      results.push({
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: '',
        passed: false,
        time: null,
        memory: null,
        error: error.message,
        statusId: null,
        statusDescription: 'Judge0 error',
        stderr: '',
        compileOutput: '',
      })
    }
  }

  return response.status(200).json({ results })
}

module.exports = { runProblem }