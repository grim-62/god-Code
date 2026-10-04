function adminOnly(request, response, next) {
  if (request.user?.role !== 'admin') {
    return response.status(403).json({ message: 'Administrator access required.' })
  }

  return next()
}

module.exports = { adminOnly }