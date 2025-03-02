var mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  id: {type: Number, required: true, unique: true},
  user: {type: String, required: true},
  typology: {type: String, required: true},
  notes: {type: String, required: true},
  location: {type: String, required: true},
  upvote: {type: Number, required: true},
  downvote: {type: Number, required: true}
});

const Report = mongoose.model('Report', ReportSchema);
module.exports = Report;