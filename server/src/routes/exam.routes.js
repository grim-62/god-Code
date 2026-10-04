const { Router } = require('express')
const rateLimit = require('express-rate-limit')
const { body, param } = require('express-validator')
const {
  createExam,
  deleteExam,
  getExam,
  getExamResults,
  getLeaderboard,
  listExams,
  logViolation,
  startExam,
  updateExam,
} = require('../controllers/exam.controller')
const { adminOnly } = require('../middleware/adminOnly')
const { protect } = require('../middleware/protect')
const { validateRequest } = require('../middleware/validateRequest')

const router = Router()
const violationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many violation reports. Please continue the exam.' },
})

const adminExamBody = [
  body('title').trim().notEmpty().withMessage('Exam title is required.'),
  body('problems').isArray({ min: 1 }).withMessage('Add at least one problem.'),
  body('problems.*.problem').isMongoId().withMessage('Each exam problem must be valid.'),
  body('problems.*.marks').isInt({ min: 0 }).withMessage('Problem marks must be a non-negative integer.'),
  body('startTime').isISO8601().withMessage('Start time must be a valid date.'),
  body('endTime').isISO8601().withMessage('End time must be a valid date.'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive number of minutes.'),
]

router.get('/', listExams)
router.get('/:id/leaderboard', param('id').isMongoId(), validateRequest, getLeaderboard)
router.get('/:id/results', protect, adminOnly, param('id').isMongoId(), validateRequest, getExamResults)
router.get('/:id', protect, param('id').isMongoId(), validateRequest, getExam)

router.post('/:id/start', protect, param('id').isMongoId(), validateRequest, startExam)
router.post(
  '/:id/violations',
  protect,
  violationLimiter,
  param('id').isMongoId(),
  body('type').isIn(['tab-hidden', 'window-blur', 'fullscreen-exit']).withMessage('Violation type is invalid.'),
  validateRequest,
  logViolation,
)

router.post('/', protect, adminOnly, ...adminExamBody, validateRequest, createExam)
router.put(
  '/:id',
  protect,
  adminOnly,
  param('id').isMongoId(),
  ...adminExamBody.map((validation) => validation.optional()),
  validateRequest,
  updateExam,
)
router.delete('/:id', protect, adminOnly, param('id').isMongoId(), validateRequest, deleteExam)

module.exports = router