const { Router } = require('express')
const rateLimit = require('express-rate-limit')
const { body } = require('express-validator')
const { runProblem } = require('../controllers/run.controller')
const { protect } = require('../middleware/protect')
const { validateRequest } = require('../middleware/validateRequest')
const { LANGUAGE_IDS } = require('../utils/judge0')

const router = Router()
const maxCodeLength = 20_000
const runLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many run requests. Please wait a minute and try again.' },
})

router.post(
  '/',
  protect,
  runLimiter,
  body('problemId').isMongoId().withMessage('Problem id is invalid.'),
  body('language').isIn(Object.keys(LANGUAGE_IDS)).withMessage('Language must be python or javascript.'),
  body('code').isString().withMessage('Code must be a string.').isLength({ max: maxCodeLength }).withMessage(`Code cannot exceed ${maxCodeLength} characters.`),
  validateRequest,
  runProblem,
)

module.exports = router