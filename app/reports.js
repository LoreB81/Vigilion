const express = require('express');
const router = express.Router();
const Report = require('./models/report');

router.get('', async (req, res) => {
  let reports = await Report.find({});

  reports = reports.map((report) => {
    return {
      self: '/api/v1/reports/' + report.id
    }
  });

  res.status(200).json(reports);
});

router.use('/:id', async (req, res, next) => {
  let report = await Report.findById(req.params.id).exec();

  if (!report) {
    res.status(404).send();
    console.log('report not found');
    return;
  }

  req['report'] = report;
  next();
});

router.get('/:id', async (req, res) => {
  let report = req['report'];
  res.status(200).json({
    self: '/api/v1/reports/' + report.id
  });
});

router.post('', async (req, res) => {
  let report = new Report({});

  report = await report.save();
  let reportId = report.id;
  console.log('report saved succesfully');

  res.location('api/v1/reports/' + reportId).status(201).send();
});

module.exports = router;