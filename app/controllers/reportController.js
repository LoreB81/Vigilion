const Report = require('../models/report.js');
const User = require('../models/user.js');

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
    /** querying the db without where clauses, to return all reports */
    const reports = await Report.find({});

    if (!reports || reports.length === 0) {
      return res.status(404).json({ error: "Reports not found" });
    }

    return res.status(200).json(reports);
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

const getLatestReports = async (req, res) => {
  try {
    /** find the latest 5 reports, sorted by descending createdtime */
    const latestReports = await Report.find({})
      .sort({ createdtime: -1 })
      .limit(5);

    if (!latestReports || latestReports.length === 0) {
      return res.status(404).json({ error: "No reports found" });
    }

    return res.status(200).json(latestReports);
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

const createReport = async (req, res) => {
  try {
    /** checking if the required parameters are given in the request body */
    const user = req.cookies.logged_user;

    if (!user || !req.body.typology || !req.body.notes || !req.body.location || !req.body.district) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newReport = new Report({
      user: user,
      typology: req.body.typology,
      notes: req.body.notes,
      location: req.body.location,
      district: req.body.district,
      upvote: 0,
      downvote: 0,
      createdtime: req.body.createdtime
    });

    const savedReport = await newReport.save();

    return res.status(201).json(savedReport);
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

const getFilteredReports = async (req, res) => {
  try {
    const { startDate, endDate, district, typology } = req.body;
    
    /** query object */
    const query = {};
    
    /** add date range filter if provided */
    if (startDate || endDate) {
      query.createdtime = {};
      if (startDate) {
        // Convert startDate to string format "YYYY-MM-DD HH:mm" for comparison
        const startDateStr = new Date(startDate).toISOString().slice(0, 10) + ' ' + 
                           new Date(startDate).toTimeString().slice(0, 5);
        query.createdtime.$gte = startDateStr;
      }
      if (endDate) {
        // Set end date to end of day (23:59) to make it inclusive
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59);
        const endDateStr = endDateTime.toISOString().slice(0, 10) + ' ' + 
                         endDateTime.toTimeString().slice(0, 5);
        query.createdtime.$lte = endDateStr;
      }
    }
    
    /** add district filter if provided */
    if (district) {
      query.district = district;
    }
    
    /** add typology filter if provided */
    if (typology) {
      query.typology = typology;
    }
    
    /** execute query */
    const reports = await Report.find(query)
      .sort({ createdtime: -1 })
      .lean();
    
    if (!reports || reports.length === 0) {
      return res.status(200).json({ error: "No reports found matching the criteria" });
    }

    /** get user data for each report */
    const reportsWithUserData = await Promise.all(reports.map(async (report) => {
      const userQuery = {id: report.user};
      const user = await User.findOne(userQuery);
      if (user) {
        report.userName = `${user.firstname} ${user.lastname}`;
      }
      return report;
    }));
    
    return res.status(200).json(reportsWithUserData);
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

module.exports = {
  getSingleReport,
  getReports,
  getLatestReports,
  createReport,
  getFilteredReports
};