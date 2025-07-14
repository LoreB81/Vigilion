const mongoose = require('mongoose');

/** user schema */
const UserSchema = new mongoose.Schema({
  id: {type: String, required: true, unique: true},
  firstname: {type: String, required: true},
  lastname: {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
  district: {type: String, required: true},
  notifications: {type: [String], default: []},
  warned: {type: Boolean, default: false},
  blocked: {type: Boolean, default: false},
  admin: {type: Boolean, default: false},
  feedbacks: {
    type: [{
      text: { type: String, required: true },
      date: {
        type: String,
        required: true,
        default: () => {
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        }
      }
    }],
    default: []
  }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;