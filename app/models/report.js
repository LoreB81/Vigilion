const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

/** report schema */
const ReportSchema = new mongoose.Schema({
  user: {type: String, required: true},
  typology: {type: String, required: true},
  notes: {type: String, required: true},
  location: {type: String, required: true},
  district: {type: String, required: true},
  upvote: {type: Number, default: 0},
  downvote: {type: Number, default: 0},
  createdtime: {type: String, default: () => {
    const now = new Date();
    return now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
  }}
});

/** ID of the report is autoincremented */
ReportSchema.plugin(AutoIncrement, {inc_field: 'id'});

const Report = mongoose.model('Report', ReportSchema);
module.exports = Report;