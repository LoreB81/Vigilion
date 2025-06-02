const Vote = require('../models/vote.js');
const Report = require('../models/report.js');

const handleVote = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = req.cookies.logged_user;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    // Find existing vote
    const existingVote = await Vote.findOne({ user: userId, report: id });

    // Get the report
    const report = await Report.findOne({ id: id });
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (existingVote) {
      // If voting the same way, remove the vote
      if (existingVote.voteType === voteType) {
        await Vote.deleteOne({ _id: existingVote._id });
        
        // Update report counts
        if (voteType === 'upvote') {
          report.upvote = Math.max(0, report.upvote - 1);
        } else {
          report.downvote = Math.max(0, report.downvote - 1);
        }
      } else {
        // If voting differently, update the vote
        existingVote.voteType = voteType;
        await existingVote.save();

        // Update report counts
        if (voteType === 'upvote') {
          report.upvote += 1;
          report.downvote = Math.max(0, report.downvote - 1);
        } else {
          report.downvote += 1;
          report.upvote = Math.max(0, report.upvote - 1);
        }
      }
    } else {
      // Create new vote
      await Vote.create({
        user: userId,
        report: id,
        voteType: voteType
      });

      // Update report counts
      if (voteType === 'upvote') {
        report.upvote += 1;
      } else {
        report.downvote += 1;
      }
    }

    await report.save();

    // Get updated vote counts
    const updatedReport = await Report.findOne({ id: id });
    const userVote = await Vote.findOne({ user: userId, report: id });

    return res.status(200).json({
      upvotes: updatedReport.upvote,
      downvotes: updatedReport.downvote,
      userVote: userVote ? userVote.voteType : null
    });

  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

const getUserVote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.cookies.logged_user;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const vote = await Vote.findOne({ user: userId, report: id });

    return res.status(200).json({ voteType: vote ? vote.voteType : null });

  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

module.exports = {
  handleVote,
  getUserVote
}; 