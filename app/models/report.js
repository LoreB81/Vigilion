var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Report', new Schema({
  reportId: Number
}));