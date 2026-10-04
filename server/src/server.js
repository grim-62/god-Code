require('./config/env')

const app = require('./app')
const connectDatabase = require('./config/database')

const port = process.env.PORT || 5000

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || /GENERATE_ME|replace-this|change-me/i.test(process.env.JWT_SECRET)) {
    throw new Error('JWT_SECRET must be a non-placeholder secret of at least 32 characters')
  }

  await connectDatabase()

  app.listen(port, () => {
    console.log(`god-code API listening on port ${port}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start god-code API:', error.message)
  process.exitCode = 1
})