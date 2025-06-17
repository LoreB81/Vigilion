const Path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

/** routes import */
const user = require('./routes/users.js');
const report = require('./routes/reportRoutes.js');

const authentication = require('./authentication.js');
const tokenChecker = require('./tokenChecker.js');

/** express.js parsing middleware */
const mongoose = require('mongoose');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/** configuring CORS */
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:8000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

/** imports all frontend pages */
const projectRoot = process.cwd();
app.use(express.static(projectRoot + '/website'));

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

/** expose circoscrizioni.geojson file to frontend */
app.get('/api/districts', (req, res) => {
  const filePath = Path.join(__dirname, '', 'circoscrizioni.geojson');
  res.sendFile(filePath);
});

/** database connection */
app.locals.db = mongoose.connect(
  process.env.DB_URL
).then(() => {
  app.listen(process.env.PORT, () => {
    console.log('The app is listening in port', process.env.PORT);
  });
});

/** authentication routing */
app.use('/api/authentication', authentication);
app.use('/api/reports', tokenChecker);

/** resource routing */
app.use('/api/reports', report);
app.use('/api/users', user);

/* default 404 handler */
app.use((req, res) => {
  res.status(404);
  res.json({ error: 'Not found' });
});

/* default error handler */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

module.exports = app;