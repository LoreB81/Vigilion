const express = require('express');
const router = express.Router();
const UserReport = require('./../models/userReport.js');
const User = require('./../models/user.js');
const Report = require('./../models/report.js');

/* TODO: change the requests to match the API */

router.get('', async (req, res) => {
  let userreports;

  if (req.query.userId) {
    userreports = await UserReport.find({
      userId: req.query.userId
    }).exec();
  } else {
    userreports = await UserReport.find({}).exec();
  }

  userreports = userreports.map((dbEntry) => {
    return {
      self: '/api/v1/userreports/' + dbEntry.id,
      user: '/api/v1/users/' + dbEntry.userId,
      report: '/api/v1/reports/' + dbEntry.reportId
    };
  });

  res.status(200).json(userreports);
});

router.post('', async (req, res) => {
  let userURL = req.body.user;
  let reportURL = req.body.report;

  if (!userURL) {
    res.status(400).json({ error: 'user not specified' });
    return;
  }

  if (!reportURL) {
    res.status(400).json({ error: 'report not specified' });
    return;
  }

  let userId = userURL.substring(userURL.lastIndexOf('/') + 1);
  let user = null;

  try {
    user = await User.findById(userId);
  } catch (error) {

  }

  if (user == null) {
    res.status(400).json({ error: 'user does not exist' });
    return;
  }

  let reportId = reportURL.substring(reportURL.lastIndexOf('/') + 1);
  let report = null;

  try {
    report = await Report.findById(reportId);
  } catch (error) {

  }

  if (report == null) {
    res.status(400).json({ error: 'report does not exist' });
    return;
  }

  let userreport = new UserReport({
    userId: userId,
    reportId: reportId
  });

  userreport = await userreport.save();
  let userreportId = userreport.id;

  res.location('api/v1/userreports/' + userreportId).status(201).send();
});

module.exports = router;