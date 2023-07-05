const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require('morgan');
const { generateRandomString, getUserByEmail } = require("./helper");
const app = express();
const PORT = 8080;

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
    password: "0000"
  }
};

app.set("view engine", "ejs");

// MIDDELWARE
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// GET ROUTES
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user_id,
    users,
    urls: urlDatabase
  };
  if (!user_id) {
    return res.render("urls_welcome", templateVars);
  }
  res.render("urls_index", templateVars);
});

/* Create new short URL */
app.get("/urls/new", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user_id: req.cookies.user_id,
    users
  };
  /* Login required to use the create new short URL feature, redirect to /login if not logged in */
  if (!user_id) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  const templateVars = {
    user_id: req.cookies.user_id,
    users,
    id: id,
    longURL: longURL
  };
  res.render("urls_show", templateVars);
});

/* Redirect user to the long URL */
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  /* Error message for non-exist short URL */
  if (!longURL) {
    return res.status(400).send(`Invalid request!`);
  }
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user_id: user_id,
    users
  };
  /* Redirect user the /urls if they are logged in */
  if (user_id) {
    res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user_id: user_id,
    users
  };
  /* Redirect user the /urls if they are logged in */
  if (user_id) {
    res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

// POST ROUTES
app.post("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
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
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

/* Update long URL for exist short URL */
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  const foundUser = getUserByEmail(inputEmail, users);
  /* Error messages for invalid login scenarios */
  if (inputEmail === "" || inputPassword === "") {
    return res.status(400).send('Email and/or Password cannot be blank!');
  }
  if (!foundUser) {
    return res.status(400).send(`${inputEmail} has not been registered!`);
  }
  if (inputPassword !== foundUser.password) {
    return res.status(401).send('Incorrect password!');
  }
  /* Set cookie for user using their id and redirect to /url */
  res.cookie("user_id", foundUser.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  const foundUser = getUserByEmail(newEmail, users);
  /* Error messages for invalid register scenarios */
  if (newEmail === "" || newPassword === "") {
    return res.status(400).send('Email and/or Password cannot be blank!');
  }
  if (foundUser) {
    return res.status(400).send(`User with email ${newEmail} already exist!`);
  }
  /* Generate new user_id and add the user to database */
  const newId = generateRandomString(5);
  users[newId] = {
    id: newId,
    email: newEmail,
    password: newPassword
  };
  /* Set cookie for user using their newly registered id and redirect to /urls */
  res.cookie("user_id", newId);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});