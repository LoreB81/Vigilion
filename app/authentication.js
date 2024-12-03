const express = require('express');
const router = express.Router();
const User = require('./models/user');
const jwt = require('jsonwebtoken');
const {OAuth2Client} = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);
async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
  });

  const payload = ticket.getPayload();
  const userid = payload['sub'];
  return payload;
}

router.post('', async function(req, res) {

	var user = {};

	if (req.body.googleToken) {
		const payload = await verify(req.body.googleToken).catch(console.error);
		console.log(payload);

		user = await User.findOne({ email: payload['email'] }).exec();
		if (!user) {
			user = new User({
				email: payload['email'],
				password: 'default-google-password-to-be-changed'
			});
			await user.save().exec();
			console.log('Student created after login with google');
		}
	}	else {
		user = await User.findOne({
			email: req.body.email
		}).exec();

		if (!user) {
			res.json({ success: false, message: 'Authentication failed. User not found.' });
			return;
		}
	
		if (user.password != req.body.password) {
			res.json({ success: false, message: 'Authentication failed. Wrong password.' });
			return;
		}
	}
	
	var payload = {
		email: user.email,
		password: user.password
	}

	var options = {
		expiresIn: 86400
	}

	var token = jwt.sign(payload, process.env.SUPER_SECRET, options);

	res.json({
		success: true,
		message: 'Enjoy your token!',
		token: token,
		email: user.email,
		password: user.password,
		self: "api/v1/" + user._id
	});
});

module.exports = router;