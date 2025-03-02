var mongoose = require('mongoose');

const UserReportSchema = new mongoose.Schema({
  user: {type: String, required: true, unique: true},
  report: {type: Number, required: true, unique: true}
});

const UserReport = mongoose.model('UserReport', UserReportSchema);
module.exports = UserReport;