const mongoose = require('mongoose')
const slugify = require('slugify')

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    index: true,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
  },
  tags: [{ type: String, trim: true }],
  description: {
    type: String,
    required: true,
  },
  constraints: {
    type: String,
    default: '',
  },
  examples: [{
    _id: false,
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
  }],
  starterCode: {
    _id: false,
    python: { type: String, default: '' },
    javascript: { type: String, default: '' },
  },
  driverCode: {
    _id: false,
    python: { type: String, default: '' },
    javascript: { type: String, default: '' },
  },
  testCases: [{
    _id: false,
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  }],
  timeLimit: {
    type: Number,
    default: 1000,
    min: 1,
  },
  memoryLimit: {
    type: Number,
    default: 256,
    min: 1,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

problemSchema.pre('validate', async function generateUniqueSlug() {
  if (!this.isModified('title') && this.slug) return

  const baseSlug = slugify(this.title, { lower: true, strict: true, trim: true }) || 'problem'
  let candidate = baseSlug
  let suffix = 1

  while (await this.constructor.exists({ slug: candidate, _id: { $ne: this._id } })) {
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }

  this.slug = candidate
})

module.exports = mongoose.models.Problem || mongoose.model('Problem', problemSchema)