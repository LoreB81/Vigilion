var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/* TODO: change the schema */
module.exports = mongoose.model('User', new Schema({
  email: String,
  password: String
}));