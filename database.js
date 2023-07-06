const bcrypt = require('bcryptjs');

// DATABASE
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    user_id: "admin"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    user_id: "admin"
  }
};

const users = {
  admin: {
    id: "admin",
    email: "admin@example.com",
    password: bcrypt.hashSync("0000", 10)
  }
};

module.exports = {
  urlDatabase,
  users
}