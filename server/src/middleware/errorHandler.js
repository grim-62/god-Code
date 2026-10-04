function errorHandler(error, _request, response, _next) {
  const status = error.status || error.statusCode || 500

  response.status(status).json({
    status: 'error',
    message: status === 500 ? 'Internal server error' : error.message,
  })
}

module.exports = { errorHandler }