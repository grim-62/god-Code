const { protect } = require('./protect')

function optionalAuth(request, response, next) {
  if (!request.headers.authorization?.startsWith('Bearer ')) {
    return next()
  }

  return protect(request, response, next)
}

module.exports = { optionalAuth }