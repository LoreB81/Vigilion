var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('UserReport', new Schema({
  userId: String,
  reportId: Number
}));