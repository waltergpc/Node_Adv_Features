const mongoose = require('mongoose')
const User = mongoose.model('User')

const userFactory = async () => {
  return new User({}).save()
}

module.exports = userFactory
