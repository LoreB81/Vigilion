const Path = require('path');

const express = require('express');
const app = express();
const cors = require('cors')

const authentication = require('./authentication.js');
const tokenChecker = require('./tokenChecker.js');

const user = require('./users.js');
const report = require('./reports.js');
const userReport = require('./userReports.js');

/**
 * Configure Express.js parsing middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * CORS requests
 */
app.use(cors());

// TODO: inserire file front-end, authentication routing e middleware, resource routing

/* Default 404 handler */
app.use((req, res) => {
  res.status(404);
  res.json({ error: 'Not found' });
});

/* Default error handler */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

module.exports = app;