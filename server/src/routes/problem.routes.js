const { Router } = require('express')
const { body, param, query } = require('express-validator')
const {
  createProblem,
  deleteProblem,
  getProblemById,
  getProblemBySlug,
  listProblems,
  updateProblem,
} = require('../controllers/problem.controller')
const { adminOnly } = require('../middleware/adminOnly')
const { optionalAuth } = require('../middleware/optionalAuth')
const { protect } = require('../middleware/protect')
const { validateRequest } = require('../middleware/validateRequest')

const router = Router()

const problemBodyValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title is required.'),
  body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be Easy, Medium, or Hard.'),
  body('tags').optional().isArray().withMessage('Tags must be an array.'),
  body('description').optional().isString().notEmpty().withMessage('Description is required.'),
  body('examples').optional().isArray().withMessage('Examples must be an array.'),
  body('starterCode').optional().isObject().withMessage('Starter code must be an object.'),
  body('driverCode').optional().isObject().withMessage('Driver code must be an object.'),
  body('testCases').optional().isArray().withMessage('Test cases must be an array.'),
  body('timeLimit').optional().isInt({ min: 1 }).withMessage('Time limit must be a positive integer.'),
  body('memoryLimit').optional().isInt({ min: 1 }).withMessage('Memory limit must be a positive integer.'),
]

router.get(
  '/',
  optionalAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be Easy, Medium, or Hard.'),
  query('search').optional().isString(),
  query('tag').optional().isString(),
  validateRequest,
  listProblems,
)

router.get(
  '/admin/:id',
  protect,
  adminOnly,
  param('id').isMongoId().withMessage('Problem id is invalid.'),
  validateRequest,
  getProblemById,
)

router.get('/:slug', param('slug').trim().notEmpty(), validateRequest, getProblemBySlug)

router.post(
  '/',
  protect,
  adminOnly,
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be Easy, Medium, or Hard.'),
  body('description').isString().notEmpty().withMessage('Description is required.'),
  ...problemBodyValidation.slice(2),
  validateRequest,
  createProblem,
)

router.put(
  '/:id',
  protect,
  adminOnly,
  param('id').isMongoId().withMessage('Problem id is invalid.'),
  ...problemBodyValidation,
  validateRequest,
  updateProblem,
)

router.delete(
  '/:id',
  protect,
  adminOnly,
  param('id').isMongoId().withMessage('Problem id is invalid.'),
  validateRequest,
  deleteProblem,
)

module.exports = router