const Report = require('../models/report.js');

const getSingleReport = async (req, res) => {
  try {
    /** querying the db using the id given in the request */
    const report = await Report.findOne({ id: req.params.id });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    return res.status(200).json(report);
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

const getReports = async (req, res) => {
  try {
    /** querying the db without where clauses, so that all reports are returned */
    const reports = Report.find({}, (err, data) => {
      if (err || !data || data.length == 0) {
        return res.status(404).json({ error: "Reports not found" });
      }

      return res.status(200).json(reports);
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

const createReport = async (req, res) => {
  try {
    /** checking if the required parameters are given in the request body */
    const user = req.cookies.logged_user;

    if (!user || !req.body.typology || !req.body.notes || !req.body.location) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newReport = new Report({
      user: user,
      typology: req.body.typology,
      notes: req.body.notes,
      location: req.body.location,
      upvote: 0,
      downvote: 0
    });

    const savedReport = await newReport.save();

    return res.status(201).json(savedReport);
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

module.exports = {
  getSingleReport,
  getReports,
  createReport
};