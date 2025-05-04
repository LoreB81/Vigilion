const Path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();

/**
 * Routes import
 */
const user = require('./routes/users.js');
const report = require('./routes/reports.js');
const userreport = require('./routes/userReports.js');

/**
 * Configure Express.js parsing middleware
 */
const mongoose = require('mongoose');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS
const corsOptions = {
  origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const projectRoot = process.cwd();
app.use(express.static(projectRoot + '/website'));

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

app.locals.db = mongoose.connect(
  process.env.DB_URL
).then(() => {
  console.log("MongoDB connection -- Ready state is: ", mongoose.connections.readyState);
  app.listen(process.env.PORT, () => {
    console.log('The app is listening in port', process.env.PORT);
  });
});

/**
 * Resource routing
 */
app.use('/api/reports', report);
app.use('/api/users', user);
// app.use('/api/v1/userreports', userreport);

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