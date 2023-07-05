const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require('morgan');
const { generateRandomString, getUserByEmail } = require("./helper");
const app = express();
const PORT = 8080;


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = {
    user_id: req.cookies.user_id,
    users,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user_id: req.cookies.user_id,
    users
  };
  if (!user_id) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const templateVars = {
    user_id: req.cookies.user_id,
    users,
    id: id,
    longURL: longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
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
  if (user_id) {
    res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

// POST ROUTES
app.post("/urls", (req, res) => {
  const newId = generateRandomString(6);
  const user_id = req.cookies.user_id;
  if (!user_id) {
    return res.send('Member exclusive feature, please login to use!');
  }
  urlDatabase[newId] = req.body.longURL;
  res.redirect(`/urls/${newId}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  const foundUser = getUserByEmail(inputEmail, users);
  if (inputEmail === "" || inputPassword === "") {
    return res.status(400).send('Email and/or Password cannot be blank!');
  }
  if (!foundUser) {
    return res.status(400).send(`${inputEmail} has not been registered!`);
  }
  if (inputPassword !== foundUser.password) {
    return res.status(401).send('Incorrect password!');
  }
  res.cookie("user_id", foundUser.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const newId = generateRandomString(5);
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  const foundUser = getUserByEmail(newEmail, users);

  if (newEmail === "" || newPassword === "") {
    return res.status(400).send('Email and/or Password cannot be blank!');
  }

  if (foundUser) {
    return res.status(400).send(`User with email ${newEmail} already exist!`);
  }

  users[newId] = {
    id: newId,
    email: newEmail,
    password: newPassword
  };

  res.cookie("user_id", newId);
  console.log(users);
  res.redirect("/urls");
});



app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});