/* TODO: check if really needed */
// const User = require('../models/user');
// const Report = require('../models/report');
// const UserReport = require('../models/userReport');

// const getReportsFromUser = async (req, res) => {
//   try {
//     /** querying the db using the id given in the request */
//     const user = await User.findOne({ id: req.params.id });

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     /** query with the user retrieved */
//     const reports = await Report.findOne({ id: user })

//     if (!reports) {
//       return res.status(404).json({ error: "No reports found for user: " + id });
//     }

//     return res.status(200).json(reports);
//   } catch (err) {
//     return res.status(500).json({ error: "Server error", details: err.message });
//   }
// };

// const createReportRelation = async (req, res) => {
//   try {

//   } catch (err) {
//     return res.status(500).json({ error: "Server error", details: err.message });
//   }
// };

// module.exports = {
//   getReportsFromUser,
//   createReportRelation
// };