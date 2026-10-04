const { Router } = require('express')
const { body } = require('express-validator')
const { getCurrentUser, login, register } = require('../controllers/auth.controller')
const { protect } = require('../middleware/protect')
const { validateRequest } = require('../middleware/validateRequest')

const router = Router()

const emailValidation = body('email')
  .trim()
  .isEmail()
  .withMessage('Enter a valid email address.')
  .normalizeEmail()

router.post(
  '/register',
  body('name').trim().notEmpty().withMessage('Name is required.'),
  emailValidation,
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
  validateRequest,
  register,
)

router.post(
  '/login',
  emailValidation,
  body('password').notEmpty().withMessage('Password is required.'),
  validateRequest,
  login,
)

router.get('/me', protect, getCurrentUser)

module.exports = router