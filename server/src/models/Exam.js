const mongoose = require('mongoose')

const violationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['tab-hidden', 'window-blur', 'fullscreen-exit'],
    required: true,
  },
  occurredAt: {
    type: Date,
    required: true,
  },
}, { _id: false })

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startedAt: {
    type: Date,
    required: true,
  },
  endsAt: {
    type: Date,
    required: true,
  },
  violations: {
    type: [violationSchema],
    default: [],
  },
}, { _id: false })

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  problems: [{
    _id: false,
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
    },
  }],
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: {
    type: [participantSchema],
    default: [],
  },
}, { timestamps: { createdAt: true, updatedAt: false } })

examSchema.index({ startTime: 1, endTime: 1 })

examSchema.pre('validate', function validateExamWindow() {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    this.invalidate('endTime', 'Exam end time must be after its start time.')
  }
})

module.exports = mongoose.models.Exam || mongoose.model('Exam', examSchema)