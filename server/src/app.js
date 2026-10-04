const cors = require('cors')
const express = require('express')
const healthRoutes = require('./routes/health.routes')
const authRoutes = require('./routes/auth.routes')
const problemRoutes = require('./routes/problem.routes')
const runRoutes = require('./routes/run.routes')
const submissionRoutes = require('./routes/submission.routes')
const userRoutes = require('./routes/user.routes')
const examRoutes = require('./routes/exam.routes')
const { errorHandler } = require('./middleware/errorHandler')
const { notFound } = require('./middleware/notFound')

const app = express()
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0)
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) {
  throw new Error('TRUST_PROXY_HOPS must be a non-negative integer')
}
if (trustProxyHops > 0) {
  app.set('trust proxy', trustProxyHops)
}

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (allowedOrigins.length) {
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }))
}
app.use(express.json())
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/problems', problemRoutes)
app.use('/api/run', runRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/users', userRoutes)
app.use('/api/exams', examRoutes)
app.use(notFound)
app.use(errorHandler)

module.exports = app