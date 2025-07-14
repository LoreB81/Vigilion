const User = require('../models/user');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const getUserData = async (req, res) => {
  try {
    /** querying the db using the id given in the request */
    const user = await User.findOne({ id: req.params.id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    /** return user's data */
    const userData = {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      district: user.district,
      admin: user.admin,
      warned: user.warned,
      blocked: user.blocked,
      notifications: user.notifications,
      feedbacks: user.feedbacks
    };

    return res.status(200).json(userData);
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

const getUsersData = async (req, res) => {
  try {
    /** querying the db without where clauses, so that all users are returned */
    const users = await User.find({});

    if (users.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }

    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

const getUserName = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    /** returns just the first and last name of the user */
    return res.status(200).json({ firstname: user.firstname, lastname: user.lastname });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const registerUser = async (req, res) => {
  try {
    /** looking if a user with the same email already exists */
    const existingUser = await User.findOne({ email: req.body.email });
    
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    /** email validation */
    if (!checkIfEmailInString(req.body.email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    /** password validation */
    if (!checkIfValidPassword(req.body.password)) {
      return res.status(400).json({ error: "Invalid password" });
    }

    /** generate uuid for the user */
    const userId = uuidv4();
    
    /** hash the password */
    const hashedPassword = hashPassword(req.body.password, userId);

    const newUser = new User({
      id: userId,
      email: req.body.email,
      password: hashedPassword,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      district: req.body.district
    });

    const savedUser = await newUser.save();
    return res.status(201).json(savedUser);
  } catch (err) {
    return res.status(500).json({ error: "Registration failed", details: err.message });
  }
};

const addFeedback = async (req, res) => {
  try {
    const userId = req.cookies.logged_user;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: "Feedback text is required" });
    }

    /** calculates current date and sends feedback */
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    user.feedbacks.push({ text, date });
    await user.save();
    return res.status(200).json({ success: true, message: "Feedback inviato" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Errore durante l'invio del feedback", details: err.message });
  }
};

const getAllFeedbacks = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    /** retrieves all users that have at least one feedback */
    const users = await User.find({ feedbacks: { $ne: [] } });
    let feedbacks = [];
    users.forEach(user => {
      user.feedbacks.forEach(feedback => {
        feedbacks.push({
          firstname: user.firstname,
          lastname: user.lastname,
          text: feedback.text,
          date: feedback.date
        });
      });
    });

    /** date filtering */
    if (startDate) {
      feedbacks = feedbacks.filter(fb => fb.date >= startDate);
    }

    if (endDate) {
      feedbacks = feedbacks.filter(fb => fb.date <= endDate);
    }

    /** orders by date descending */
    feedbacks.sort((a, b) => b.date.localeCompare(a.date));
    return res.status(200).json(feedbacks);
  } catch (err) {
    return res.status(500).json({ error: "Errore durante il recupero dei feedback", details: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    /** get the user's ID from cookies */
    const userId = req.cookies.logged_user;
    
    /** find the user using the ID retrieved before */
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    /** hash the old password */
    const hashedOldPassword = hashPassword(req.body.oldPassword, userId);

    /** verify old password */
    if (hashedOldPassword !== user.password) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    /** validate new password */
    if (!checkIfValidPassword(req.body.newPassword)) {
      return res.status(400).json({ error: "The new password does not match the security requirements" });
    }

    /** hash the new password */
    const hashedNewPassword = hashPassword(req.body.newPassword, userId);

    /** update the password */
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password modified successfully"
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error while changing password", details: err.message });
  }
};

const changeDistrict = async (req, res) => {
  try {
    /** get the user's ID from cookies */
    const userId = req.cookies.logged_user;
    
    /** find the user using the ID retrieved before */
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    /** checks valid districts */
    const validDistricts = [
      "Gardolo", "Meano", "Bondone", "Sardagna", "Ravina-Romagnano",
      "Argentario", "Povo", "Mattarello", "Villazzano", "Oltrefersina",
      "San Giuseppe-Santa Chiara", "Centro Storico-Piedicastello"
    ];

    if (!validDistricts.includes(req.body.district)) {
      return res.status(400).json({ error: "Invalid district" });
    }

    /** update the district */
    user.district = req.body.district;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "District changed successfully"
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error while changing district", details: err.message });
  }
};

const changeEmail = async (req, res) => {
  try {
    /** get the user's ID from cookies */
    const userId = req.cookies.logged_user;
    
    /** find the user using the ID retrieved before */
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    /** verify old email */
    if (user.email !== req.body.oldEmail) {
      return res.status(400).json({ error: "Old email is incorrect" });
    }

    /** validate new email format */
    if (!checkIfEmailInString(req.body.newEmail)) {
      return res.status(400).json({ error: "The new email format is not valid" });
    }

    /** check if new email is already in use by another user */
    const existingUser = await User.findOne({ email: req.body.newEmail });
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ error: "Email already in use" });
    }

    /** update the email */
    user.email = req.body.newEmail;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email modified successfully"
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error while changing email", details: err.message });
  }
};

const changeNotifications = async (req, res) => {
  try {
    const userId = req.cookies.logged_user;
    const user = await User.findOne({ id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!Array.isArray(req.body.notifications)) {
      return res.status(400).json({ error: "Notifications must be an array" });
    }
    
    user.notifications = req.body.notifications;
    await user.save();
    return res.status(200).json({ success: true, message: "Notifications updated" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error while updating notifications", details: err.message });
  }
};

/** PATCH: /api/users/:id/warn */
const warnUser = async (req, res) => {
  if (!(await isAdmin(req))) {
    return res.status(403).json({ error: 'Only admins can warn users' });
  }

  const user = await User.findOne({ id: req.params.id });
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.warned = true;
  await user.save();
  res.json({ success: true, message: 'User warned' });
};

/** PATCH: /api/users/:id/ban */
const banUser = async (req, res) => {
  if (!(await isAdmin(req))) {
    return res.status(403).json({ error: 'Only admins can ban users' });
  }

  const user = await User.findOne({ id: req.params.id });
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.blocked = true;
  await user.save();
  res.json({ success: true, message: 'User banned' });
};

/** PATCH: /api/users/:id/reactivate */
const reactivateUser = async (req, res) => {
  if (!(await isAdmin(req))) {
    return res.status(403).json({ error: 'Only admins can reactivate users' });
  }

  const user = await User.findOne({ id: req.params.id });
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  user.blocked = false;
  user.warned = false;
  await user.save();
  res.json({ success: true, message: 'User reactivated' });
};

/** DELETE: /api/users/delete-account */
const deleteUser = async (req, res) => {
  try {
    /** get the user's ID from cookies */
    const userId = req.cookies.logged_user;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    /** find the user using the ID retrieved before */
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    /** delete the user from the database */
    await User.deleteOne({ id: userId });

    /** clear the authentication cookie */
    res.clearCookie('logged_user');
    res.clearCookie('auth_token');

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error while deleting account", details: err.message });
  }
};

/**
 * Checks if the user is an admin
 * @param {Request} req - The request object
 * @returns {boolean} - True if the user is an admin
 */
async function isAdmin(req) {
  const userId = req.cookies.logged_user;
  const user = await User.findOne({ id: userId });
  return user && user.admin;
}

/**
 * Hash a password using SHA-256 with the user's UUID as salt
 * @param {string} password - The plain text password
 * @param {string} salt - The UUID to use as salt
 * @returns {string} - The hashed password
 */
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

/**
 * Checks whether the password is valid or not using a regex
 * @param {string} password - Plain password
 * @returns {boolean} - True if the password is valid
 */
function checkIfValidPassword(password) {
  var re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d#@$!%*?&]{8,}$/;
  return re.test(password);
}

/**
 * Checks whether the email is valid or not using a regex
 * @param {email} email - User's email
 * @returns {boolean} - True if the email is in valid format
 */
function checkIfEmailInString(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

module.exports = {
  getUserData,
  getUsersData,
  getUserName,
  registerUser,
  addFeedback,
  getAllFeedbacks,
  changePassword,
  changeDistrict,
  changeEmail,
  changeNotifications,
  warnUser,
  banUser,
  reactivateUser,
  deleteUser
};