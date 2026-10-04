const jwt = require('jsonwebtoken')
const User = require('../models/User')

async function protect(request, response, next) {
  const authorization = request.headers.authorization
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  if (!token) {
    return response.status(401).json({ message: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub)

    if (!user) {
      return response.status(401).json({ message: 'User account no longer exists.' })
    }

    request.user = user
    return next()
  } catch (_error) {
    return response.status(401).json({ message: 'Invalid or expired access token.' })
  }
}

module.exports = { protect }