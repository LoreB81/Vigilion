const app = require('./app/app.js');
const mongoose = require('mongoose');

const port = process.env.PORT || 8080;

app.locals.db = mongoose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true})
.then( () => {
  console.log("connected to database");

  app.listen(port, () => {
    console.log(`server listening on port ${port}`);
  })
})