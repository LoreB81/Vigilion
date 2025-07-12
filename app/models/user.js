const mongoose = require('mongoose');

/** user schema */
const UserSchema = new mongoose.Schema({
  id: {type: String, required: true, unique: true},
  firstname: {type: String, required: true},
  lastname: {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
  district: {type: String, required: true},
  notifications: {type: [String], default: []},
  warned: {type: Boolean, default: false},
  blocked: {type: Boolean, default: false},
  admin: {type: Boolean, default: false}
});

const User = mongoose.model('User', UserSchema);
module.exports = User;