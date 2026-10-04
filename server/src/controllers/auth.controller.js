const jwt = require('jsonwebtoken')
const User = require('../models/User')

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }
}

function createAccessToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.')
  }

  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

async function register(request, response) {
  const { name, email, password } = request.body
  const existingUser = await User.findOne({ email })

  if (existingUser) {
    return response.status(409).json({ message: 'An account with this email already exists.' })
  }

  try {
    const user = await User.create({ name, email, password })
    const token = createAccessToken(user)

    return response.status(201).json({ user: toPublicUser(user), token })
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: 'An account with this email already exists.' })
    }
    throw error
  }
}

async function login(request, response) {
  const { email, password } = request.body
  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    return response.status(401).json({ message: 'No account was found for this email.' })
  }

  if (!(await user.comparePassword(password))) {
    return response.status(401).json({ message: 'Incorrect password.' })
  }

  const token = createAccessToken(user)
  return response.status(200).json({ user: toPublicUser(user), token })
}

function getCurrentUser(request, response) {
  return response.status(200).json({ user: toPublicUser(request.user) })
}

module.exports = { getCurrentUser, login, register }