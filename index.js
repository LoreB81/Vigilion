const app = require('./app/app.js');
const mongoose = require('mongoose');

const express = require('express');
const path = require('path');

const port = process.env.PORT || 8080;

app.locals.db = mongoose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true})
.then( () => {
  console.log("connected to database");

  app.listen(port, () => {
    console.log(`server listening on port ${port}`);
  })
})

const projectRoot = path.join(__dirname, 'website');
app.use(express.static(projectRoot));

app.get('/', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
})