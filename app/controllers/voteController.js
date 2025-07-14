const Vote = require('../models/vote.js');
const Report = require('../models/report.js');

/** POST: /api/reports/:id/vote */
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

    /** find existing vote */
    const existingVote = await Vote.findOne({ user: userId, report: id });

    /** get the report from the id */
    const report = await Report.findOne({ id: id });
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (existingVote) {
      /** if the vote clicked is the same, remove it */
      if (existingVote.voteType === voteType) {
        await Vote.deleteOne({ _id: existingVote._id });
        
        /** update report counts */
        if (voteType === 'upvote') {
          report.upvote = Math.max(0, report.upvote - 1);
        } else {
          report.downvote = Math.max(0, report.downvote - 1);
        }
      } else {
        /** if the vote is different, update the vote count */
        existingVote.voteType = voteType;
        await existingVote.save();

        /** update report counts */
        if (voteType === 'upvote') {
          report.upvote += 1;
          report.downvote = Math.max(0, report.downvote - 1);
        } else {
          report.downvote += 1;
          report.upvote = Math.max(0, report.upvote - 1);
        }
      }
    } else {
      /** if the user has yet to vote, create a new one */
      await Vote.create({
        user: userId,
        report: id,
        voteType: voteType
      });

      /** update report counts */
      if (voteType === 'upvote') {
        report.upvote += 1;
      } else {
        report.downvote += 1;
      }
    }

    await report.save();

    /** get updated vote counts */
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

/** GET: /api/reports/:id/user-vote */
const getUserVote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.cookies.logged_user;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    /** gets the user's vote */
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