var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/* TODO: change the schema */
module.exports = mongoose.model('UserReport', new Schema({
  userId: String,
  reportId: Number
}));