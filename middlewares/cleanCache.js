const { clearHash } = require('../services/cache')

const clearCache = async (req, res, next) => {
  await next()
  clearHash(req.user.id)
}

module.exports = clearCache
