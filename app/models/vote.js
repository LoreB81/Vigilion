const mongoose = require('mongoose');

/** vote schema */
const VoteSchema = new mongoose.Schema({
  user: { type: String, required: true },
  report: { type: Number, required: true },
  voteType: { type: String, enum: ['upvote', 'downvote'], required: true },
  createdAt: { type: Date, default: Date.now }
});

/** creates a compound index to ensure one vote per user per report */
VoteSchema.index({ user: 1, report: 1 }, { unique: true });

const Vote = mongoose.model('Vote', VoteSchema);
module.exports = Vote; 