const express = require('express');
const router = express.Router();
const User = require('./models/user');
const jwt = require('jsonwebtoken');
const {OAuth2Client} = require('google-auth-library');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

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
			const userId = uuidv4();
			// Hash a default password for Google users
			const defaultPassword = crypto.createHash('sha256').update('default-google-password-to-be-changed' + userId).digest('hex');
			
			user = new User({
				id: userId,
				email: payload['email'],
				password: defaultPassword
			});
			await user.save().exec();
			console.log('User created after login with google');
		}
	}	else {
		user = await User.findOne({
			email: req.body.email
		}).exec();

		if (!user) {
			res.json({ success: false, message: 'Authentication failed. User not found.' });
			return;
		}
	
		// Hash the input password with the user's id as salt
		const hashedPassword = crypto.createHash('sha256').update(req.body.password + user.id).digest('hex');
		
		// Compare the hashed password with the one stored in the database
		if (user.password !== hashedPassword) {
			res.json({ success: false, message: 'Authentication failed. Wrong password.' });
			return;
		}
	}
	
	var payload = {
		email: user.email,
		id: user.id
	}

	var options = {
		expiresIn: 86400
	}

	var token = jwt.sign(payload, process.env.SUPER_SECRET, options);

	// Set HTTP-only cookie with the token
	res.cookie('auth_token', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
		sameSite: 'strict',
		maxAge: 86400000 // 24 hours in milliseconds
	});

	res.cookie('logged_user', user.id, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: 86400000
	})

	res.json({
		success: true,
		message: 'Login successful!',
		email: user.email,
		id: user.id,
		self: "api/users/" + user._id
	});
});

// Add logout endpoint
router.post('/logout', function(req, res) {
	res.clearCookie('auth_token');
	res.json({ success: true, message: 'Logged out successfully' });
});

// Add authentication check endpoint
router.get('/check', function(req, res) {
	const token = req.cookies.auth_token;
	
	if (!token) {
		return res.json({ authenticated: false });
	}

	jwt.verify(token, process.env.SUPER_SECRET, function(err, decoded) {
		if (err) {
			return res.json({ authenticated: false });
		}
		res.json({ 
			authenticated: true,
			user: {
				email: decoded.email,
				id: decoded.id
			}
		});
	});
});

module.exports = router;