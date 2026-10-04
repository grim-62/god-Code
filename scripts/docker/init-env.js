const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const templatePath = path.join(root, '.env.example')
const envPath = path.join(root, '.env')
const secretNames = [
  'JWT_SECRET',
  'JUDGE0_AUTHN_TOKEN',
  'JUDGE0_POSTGRES_PASSWORD',
  'JUDGE0_REDIS_PASSWORD',
]

if (fs.existsSync(envPath)) {
  throw new Error('Root .env already exists. It was not changed.')
}

let contents = fs.readFileSync(templatePath, 'utf8')
for (const name of secretNames) {
  const placeholder = `${name}=GENERATE_ME`
  if (!contents.includes(placeholder)) {
    throw new Error(`Expected ${name} placeholder is missing from .env.example.`)
  }
  contents = contents.replace(placeholder, `${name}=${crypto.randomBytes(32).toString('hex')}`)
}

const judge0Token = contents.match(/^JUDGE0_AUTHN_TOKEN=(.+)$/m)?.[1]
if (!judge0Token || !contents.includes('JUDGE0_API_KEY=GENERATE_ME')) {
  throw new Error('Expected matching Judge0 API key placeholders are missing from .env.example.')
}
contents = contents.replace('JUDGE0_API_KEY=GENERATE_ME', `JUDGE0_API_KEY=${judge0Token}`)

fs.writeFileSync(envPath, contents, { flag: 'wx', mode: 0o600 })
console.log('Created root .env with unique secrets. Keep this file private.')
