const LANGUAGE_IDS = Object.freeze({
  python: 71,
  javascript: 63,
})

async function runCode({ sourceCode, languageId, stdin, timeLimit, memoryLimit }) {
  const judge0Url = process.env.JUDGE0_URL?.replace(/\/+$/, '')

  if (!judge0Url) {
    throw new Error('JUDGE0_URL is not configured.')
  }

  const headers = { 'Content-Type': 'application/json' }
  if (process.env.JUDGE0_API_KEY) {
    headers['X-Auth-Token'] = process.env.JUDGE0_API_KEY
  }

  let response
  try {
    response = await fetch(`${judge0Url}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin,
        cpu_time_limit: Number(timeLimit) / 1000,
        memory_limit: Number(memoryLimit) * 1024,
      }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('Judge0 did not respond within 20 seconds.')
    }
    throw new Error(`Unable to reach Judge0: ${error.message}`)
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(result.message || result.error || `Judge0 returned HTTP ${response.status}.`)
  }

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    compileOutput: result.compile_output || '',
    statusId: result.status?.id ?? null,
    statusDescription: result.status?.description || 'Unknown',
    time: result.time ?? null,
    memory: result.memory ?? null,
  }
}

module.exports = { LANGUAGE_IDS, runCode }