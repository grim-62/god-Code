const fs = require('node:fs')
const path = require('node:path')
const dotenv = require('dotenv')

const rootEnvPath = path.resolve(__dirname, '../../../.env')

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath })
}
