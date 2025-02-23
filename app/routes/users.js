const express = require('express');
const router = express.Router();
const User = require('./../models/user.js');

/* TODO: change the requests to match the API */

// router.get('/me', async (req, res) => {
//     if (!req.loggedUser) {
//       return;
//     }

//     let student = await User.findOne({email: req.loggedUser.email});

//     res.status(200).json({
//       self: '/api/v1/user/' + student.id,
//       email: student.email
//     });
// });

router.get('', async (req, res) => {
  let users;

  if (req.query.email)
    users = await User.find({email: req.query.email}).exec();
  else
  users = await User.find().exec();

  users = users.map( (entry) => {
  return {
    self: '/api/v1/users/' + entry.id,
    email: entry.email
  }
  });

  res.status(200).json(users);
});

router.post('', async (req, res) => {
	let user = new User({
    email: req.body.email,
    password: req.body.password
  });

  if (!user.email || typeof user.email != 'string' || !checkIfEmailInString(user.email)) {
    res.status(400).json({ error: 'The field "email" must be a non-empty string, in email format' });
    return;
  }
    
	user = await user.save();
    
  let userId = user.id;

  res.location("/api/v1/users/" + userId).status(201).send();
});

function checkIfEmailInString(text) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(text);
}

module.exports = router;