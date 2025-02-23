const Path = require('path');
const express = require('express');
const app = express();

/**
 * Routes import
 */
const user = require('./routes/users.js');
const report = require('./routes/reports.js');
const userReport = require('./routes/userReports.js');

/**
 * Configure Express.js parsing middleware
 */
const mongoose = require('mongoose');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const projectRoot = process.cwd();
app.use(express.static(projectRoot + '/website'));

app.locals.db = mongoose.connect(
  process.env.DB_URL,
  { useNewUrlParser: true, useUnifiedTopology: true }
).then(() => {
  console.log("MongoDB connection -- Ready state is: ", mongoose.connections.readyState);
  app.listen(process.env.PORT, () => {
    console.log('The app is listening in port ', process.env.PORT);
  });
});

// app.use((req,res,next) => {
//     console.log(req.method + ' ' + req.url)
//     next()
// })

// /**
//  * Authentication routing and middleware
//  */
// app.use('/api/v1/authentication', authentication);

// // Protect booklendings endpoint
// // access is restricted only to authenticated users
// // a valid token must be provided in the request
// app.use('/api/v1/userreports', tokenChecker);
// //app.use('/api/v1/students/me', tokenChecker);

// /**
//  * Resource routing
//  */
// app.use('/api/v1/reports', report);
// app.use('/api/v1/users', user);
// app.use('/api/v1/userreport', userReport);

// /* Default 404 handler */
// app.use((req, res) => {
//   res.status(404);
//   res.json({ error: 'Not found' });
// });

// /* Default error handler */
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Something broke!' });
// });

module.exports = app;