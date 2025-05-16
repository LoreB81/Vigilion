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

    return res.status(200).json(user);
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

    // Generate UUID for the user
    const userId = uuidv4();
    
    // Hash the password using SHA-256 with the UUID as salt
    const hashedPassword = hashPassword(req.body.password, userId);

    const newUser = new User({
      id: userId,
      email: req.body.email,
      password: hashedPassword,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      circoscrizione: req.body.circoscrizione
    });

    const savedUser = await newUser.save();
    return res.status(201).json(savedUser);
  } catch (err) {
    return res.status(500).json({ error: "Registration failed", details: err.message });
  }
};

/**
 * Hash a password using SHA-256 with a user's UUID as salt
 * @param {string} password - The plain text password
 * @param {string} salt - The UUID to use as salt
 * @returns {string} - The hashed password
 */
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

/* TODO: match the password validation with the requirements in D1 document */
function checkIfValidPassword(password) {
  var re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
}

function checkIfEmailInString(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

module.exports = {
  getUserData,
  getUsersData,
  registerUser
};