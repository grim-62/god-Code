const fs = require('node:fs')

const secretNames = [
  'JUDGE0_AUTHN_TOKEN',
  'JUDGE0_POSTGRES_PASSWORD',
  'JUDGE0_REDIS_PASSWORD',
]

for (const name of secretNames) {
  const value = process.env[name]
  if (!value || !/^[A-Za-z0-9_-]{32,}$/.test(value)) {
    throw new Error(`${name} must contain at least 32 letters, numbers, underscores, or hyphens.`)
  }
  if (value === 'GENERATE_ME') {
    throw new Error(`${name} is still a placeholder; generate unique secrets before starting Compose.`)
  }
}

if (process.env.JUDGE0_API_KEY !== process.env.JUDGE0_AUTHN_TOKEN) {
  throw new Error('JUDGE0_API_KEY must match JUDGE0_AUTHN_TOKEN.')
}

const config = [
  'ENABLE_WAIT_RESULT=true',
  'MAX_QUEUE_SIZE=100',
  'AUTHN_HEADER=X-Auth-Token',
  `AUTHN_TOKEN=${process.env.JUDGE0_AUTHN_TOKEN}`,
  'REDIS_HOST=judge0-redis',
  'REDIS_PORT=6379',
  `REDIS_PASSWORD=${process.env.JUDGE0_REDIS_PASSWORD}`,
  'POSTGRES_HOST=judge0-postgres',
  'POSTGRES_PORT=5432',
  'POSTGRES_DB=judge0',
  'POSTGRES_USER=judge0',
  `POSTGRES_PASSWORD=${process.env.JUDGE0_POSTGRES_PASSWORD}`,
  'CPU_TIME_LIMIT=2',
  'MAX_CPU_TIME_LIMIT=5',
  'CPU_EXTRA_TIME=1',
  'MEMORY_LIMIT=256000',
  'MAX_MEMORY_LIMIT=512000',
  'RAILS_ENV=production',
  '',
].join('\n')

const configPath = '/judge0-config/judge0.conf'
fs.writeFileSync(configPath, config, { mode: 0o400 })
fs.chownSync(configPath, 1000, 1000)
console.log('Generated Judge0 configuration.')
