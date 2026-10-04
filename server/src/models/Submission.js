const mongoose = require('mongoose')

const verdicts = [
  'Accepted',
  'Wrong Answer',
  'Time Limit Exceeded',
  'Runtime Error',
  'Compilation Error',
  'Pending',
]

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    index: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    index: true,
  },
  language: {
    type: String,
    enum: ['python', 'javascript'],
    required: true,
  },
  code: {
    type: String,
    required: true,
    select: false,
  },
  verdict: {
    type: String,
    enum: verdicts,
    default: 'Pending',
    index: true,
  },
  runtimeMs: {
    type: Number,
    default: 0,
  },
  memoryKb: {
    type: Number,
    default: 0,
  },
  passed: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  failedCase: {
    _id: false,
    input: String,
    expected: String,
    actual: String,
    error: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
})

module.exports = mongoose.models.Submission || mongoose.model('Submission', submissionSchema)