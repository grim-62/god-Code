const { validationResult } = require('express-validator')

function validateRequest(request, response, next) {
  const errors = validationResult(request)

  if (!errors.isEmpty()) {
    return response.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array(),
    })
  }

  return next()
}

module.exports = { validateRequest }