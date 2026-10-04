const { Router } = require('express')
const { body, param, query } = require('express-validator')
const { createSubmission, getSubmission, listProblemSubmissions } = require('../controllers/submission.controller')
const { protect } = require('../middleware/protect')
const { validateRequest } = require('../middleware/validateRequest')
const { LANGUAGE_IDS } = require('../utils/judge0')

const router = Router()
const maxCodeLength = 20_000

router.get(
  '/',
  protect,
  query('problemId').isMongoId().withMessage('Problem id is invalid.'),
  validateRequest,
  listProblemSubmissions,
)

router.post(
  '/',
  protect,
  body('problemId').isMongoId().withMessage('Problem id is invalid.'),
  body('examId').optional().isMongoId().withMessage('Exam id is invalid.'),
  body('language').isIn(Object.keys(LANGUAGE_IDS)).withMessage('Language must be python or javascript.'),
  body('code').isString().withMessage('Code must be a string.').isLength({ max: maxCodeLength }).withMessage(`Code cannot exceed ${maxCodeLength} characters.`),
  validateRequest,
  createSubmission,
)

router.get(
  '/:id',
  protect,
  param('id').isMongoId().withMessage('Submission id is invalid.'),
  validateRequest,
  getSubmission,
)

module.exports = router