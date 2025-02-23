var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/* TODO: change the schema */
module.exports = mongoose.model('Report', new Schema({
  reportId: Number
}));