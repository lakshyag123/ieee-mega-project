//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/usersDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  name: String,
  room_no: String,
  roll_no: String,
  username: String,
  verify: false,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("login");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render('register');
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function (req, res) {

  if (req.body.password !== req.body.confirm_password) {
    res.send('Password does not match try again');
  }
  else {
    User.findOne({ username: req.body.username }, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          res.send('User already exists please login');
        } else {
          User.register({ name: req.body.name, room_no: req.body.room_no, roll_no: req.body.roll_no, username: req.body.username, verify: false }, req.body.password, function (err, user) {
            if (err) {
              console.log(err);
              res.redirect("/");
            } else {
              res.render("regSuccess");
            }
          });
        }
      }
    });

  }


});

app.post("/", passport.authenticate('local', { failWithError: true }), function (req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      User.findOne({ username: req.body.username }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            if (foundUser.verify === false) {
              res.send('Your account is not yet verified, please check after you are verified');
              foundUser.verify = true;
              foundUser.save();
            } else {
              passport.authenticate("local")(req, res, function () {

                if (err) {
                  console.log(err);
                } else {
                  res.redirect("/secrets");
                }
              });
            }
          }
        }
      });

    }
  });
}, function (err, req, res, next) {
  return res.render('unsuccessful');
});







app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
