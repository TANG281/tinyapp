const express = require('express');
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const { generateRandomString, getUserByEmail } = require("./helpers");
const { urlDatabase, users } = require('./database');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

// MIDDELWARE
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'user_id',
  keys: ['nindoking', 'dragonite', 'crobat'],
  maxAge: 30 * 60 * 1000 // Cookies expire in 30 minutes
}));

// GET ROUTES
app.get("/", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = {
    user_id,
    users,
    urls: urlDatabase
  };
  /* Render welcome page if user is no logged in */
  if (!user_id) {
    return res.render("urls_welcome", templateVars);
  }
  /* Render index page with list of shorten URL */
  res.render("urls_index", templateVars);
});

/* New short URL form */
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = {
    user_id: req.session.user_id,
    users
  };
  /* Login required to use the create new short URL feature, redirect to /login if not logged in */
  if (!user_id) {
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

/* Edit form for individual short URL */
app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const id = req.params.id;  
  const templateVars = {
    user_id: req.session.user_id,
    users,
    id,
    urlDatabase
  };
  
  /* Error message for non-exist short URL */
  if (!urlDatabase[id]) {
    return res.status(400).send(`Invalid request!`);
  }
  /* Error messages for unauthorized access */
  if (!user_id) {
    return res.status(403).send("Login required!")
  }
  if (urlDatabase[id].user_id !== user_id) {
    return res.status(401).send('Unauthorized access!');
  }

  res.render("urls_show", templateVars);
});

/* Redirect user to the long URL */
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  
  /* Error message for non-exist short URL */
  if (!urlDatabase[id]) {
    return res.status(400).send(`Invalid request!`);
  }
  
  res.redirect(urlDatabase[id].longURL);
});

/* Registration page */
app.get("/register", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = {
    user_id: user_id,
    users
  };
  /* Redirect user the /urls if they are logged in */
  if (user_id) {
    return res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

/* Login page */
app.get("/login", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = {
    user_id: user_id,
    users
  };
  /* Redirect user the /urls if they are logged in */
  if (user_id) {
    return res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

// POST ROUTES

/* Create new short URL */
app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;
  /* Error message if user is not logged in */
  if (!user_id) {
    return res.send('Member exclusive feature, please login to use!');
  }
  /* Generate new shortURL and add it to the database */
  const newId = generateRandomString(6);
  urlDatabase[newId] = {
    longURL: req.body.longURL,
    user_id
  };
  res.redirect(`/urls/${newId}`);
});

/* Delete short URL */
app.delete("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const id = req.params.id;
  /* Error messages for unauthorized access */
  if (!user_id) {
    return res.status(403).send('Login required.');
  }
  if (user_id !== urlDatabase[id].user_id) {
    return res.status(401).send('Unauthorized!');
  }
  /* Error message if the short URL is not in database */
  if (!urlDatabase[id]) {
    return res.status(404).send('Not Found!');
  }
  delete urlDatabase[id];
  res.redirect("/urls");
});

/* Update long URL for exist short URL */
app.put("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const id = req.params.id;
  /* Error messages for unauthorized access */
  if (!user_id) {
    return res.status(403).send('Login required.');
  }
  if (user_id !== urlDatabase[id].user_id) {
    return res.status(401).send('Unauthorized!');
  }
  /* Error message if the short URL is not in database */
  if (!urlDatabase[id]) {
    return res.status(404).send('Not Found!');
  }
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect("/urls");
});

/* Login user */
app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  const foundUser = getUserByEmail(inputEmail, users);
  /* Error messages for invalid login scenarios */
  if (inputEmail === "" || inputPassword === "") {
    return res.status(400).send('Email and/or Password cannot be blank!');
  }
  if (!foundUser) {
    return res.status(400).send('Incorrect email/password!');
  }
  if (!bcrypt.compareSync(inputPassword, foundUser.password)) {
    return res.status(401).send('Incorrect email/password!');
  }
  /* On successfull log in, set cookies for user using their id and redirect to /url */
  req.session.user_id = foundUser.id;
  res.redirect("/urls");
});

/* Logout user */
app.post("/logout", (req, res) => {
  /* Clear user_id cookies on logout and redirect user to login page */
  req.session = null;
  res.redirect("/login");
});

/* Create new account */
app.post("/register", (req, res) => {
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  const foundUser = getUserByEmail(newEmail, users);
  /* Error messages for invalid register scenarios */
  if (newEmail === "" || newPassword === "") {
    return res.status(400).send('Email and/or Password cannot be blank!');
  }
  if (foundUser) {
    return res.status(400).send(`User already exist!`);
  }
  /* Generate new account and add it to database */
  const newId = generateRandomString(5);
  users[newId] = {
    id: newId,
    email: newEmail,
    password: bcrypt.hashSync(newPassword, 10)
  };
  /* Set cookie for user using their newly registered id and redirect to /urls */
  req.session.user_id = newId;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});