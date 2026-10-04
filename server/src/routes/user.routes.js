const { Router } = require('express')
const { getMyStats } = require('../controllers/user.controller')
const { protect } = require('../middleware/protect')

const router = Router()

router.get('/me/stats', protect, getMyStats)

module.exports = router