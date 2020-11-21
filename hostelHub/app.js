//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const crypto = require('crypto');
const path = require('path');
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const sgmail = require('@sendgrid/mail');
const API_KEY = 'api key goes here';  //i will give the api key
const multer = require('multer');
const e = require('express');
const upload = multer({ dest: 'public/uploads/' })
const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
sgmail.setApiKey(API_KEY);
app.use(session({
  secret: 'tubahutbadawalahai.',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb url goes here', { useNewUrlParser: true });  // i will give the mongodb server url
mongoose.set("useCreateIndex", true);

var storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
  }
});

var uploads = multer({
  storage: storage
}).single('file')
const userSchema = new mongoose.Schema({
  name: String,
  room_no: String,
  hostel_no: String,
  roll_no: String,
  phone: String,
  username: String,
  password: String,
  image: String,
  verify: Boolean
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function (req, res) {
  res.render("home", { message: '', user: '' });
});
app.get('/register', function (req, res) {
  res.render('register', { message: '', user: '' });
});
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});
app.get("/dashboard", function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      User.find({ username: req.user.username }, function (err, found) {
        if (err) {
          console.log(err);
        } else {
          if (found) {
            res.send('dashboard');
          }
        }
      });
    } else {
      res.redirect('/logout');
    }

  } else {
    res.redirect("/");
  }
});


app.get('/adminDashboard', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      User.find({}, function (err, foundUsers) {
        if (err) {
          console.log(err);
        } else {
          res.render('adminPage', { members: foundUsers });
        }
      });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/');
  }
});
app.get('/adminDashboard/:id', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const id = req.params.id;
      User.findOne({ _id: id }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            res.render('verifyUsers', { user: foundUser });
          }
        }
      });
    } else {
      res.redirect('/logout');
    }

  } else {
    res.redirect('/');
  }
});
app.post('/adminDashboard/:id', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const id = req.params.id;
      User.findOne({ _id: id }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            foundUser.verify = true;
            foundUser.save();
            const message = {
              to: foundUser.username,
              from: 'bithostelhub@gmail.com',
              subject: 'Hello ' + foundUser.name,
              html: '<h1>Congrats your account is verified</h1>'
            };
            sgmail.send(message);
            res.redirect('/adminDashboard');

          }
        }
      });
    } else {
      res.redirect('/logout');
    }

  } else {
    res.redirect('/');
  }
});

app.post('/rejected/:id', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const id = req.params.id;
      User.findOne({ _id: id }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            foundUser.verify = false;
            foundUser.save();
            const message = {
              to: foundUser.username,
              from: 'bithostelhub@gmail.com',
              subject: 'Hello ' + foundUser.name,
              html: '<h1>There are some problems with your account credentials, kindly reach the admin office at the earliest to sort the issue</h1>'
            };
            sgmail.send(message);
            res.redirect('/adminDashboard');

          }
        }
      });
    } else {
      res.redirect('/logout');
    }

  } else {
    res.redirect('/');
  }
});
app.get('/forgotpassword', function (req, res) {
  res.render('forgotpassword', { message: '' });
});
app.post('/forgotpassword', function (req, res) {
  User.findOne({ username: req.body.username }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {

        crypto.randomBytes(48, function (err, buffer) {
          const token = buffer.toString('hex');
          const message = {
            to: foundUser.username,
            from: 'bithostelhub@gmail.com',
            subject: 'Password-reset',
            html: `<h1> Hello ${foundUser.name}</h1>
            <p><h4>Click on the following link down below to reset your password, if the link was not requested by you, please contact the admin</h4></p>
            <a href="http://localhost:3000/passwordReset/${token}/${foundUser._id}">Click here</a>`
          };
          sgmail.send(message);
          res.render('forgotpassword', { message: 'The reset link has been sent to the given mail Id' });
        });


      } else {
        res.render('forgotpassword', { message: 'The email Id is not registered' })
      }
    }
  })
});
app.get('/passwordReset/:time/:id', function (req, res) {
  const id = req.params.id;
  User.findOne({ _id: id }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        res.render('passwordReset', { message: '', time: req.params.time, id: req.params.id });
      } else {
        res.redirect('/');
      }
    }
  });
});
app.post('/passwordReset/:time/:id', function (req, res) {
  const id = req.params.id;
  User.findOne({ _id: id })
    .then((foundUser) => {
      if (foundUser) {
        let updateUser
        if (foundUser.verify == null) {
          updateUser = new User({
            name: foundUser.name,
            room_no: foundUser.room_no,
            hostel_no: foundUser.hostel_no,
            roll_no: foundUser.roll_no,
            phone: foundUser.phone,
            username: foundUser.username,
            image: foundUser.image,
          });
        } else {
          updateUser = new User({
            name: foundUser.name,
            room_no: foundUser.room_no,
            hostel_no: foundUser.hostel_no,
            roll_no: foundUser.roll_no,
            phone: foundUser.phone,
            username: foundUser.username,
            image: foundUser.image,
            verify: foundUser.verify
          });
        }

        if (req.body.password.length < 6) {
          res.render('passwordReset', { message: 'Password must be atleast 6 characters long', time: req.params.time, id: req.params.id });
        } else if (req.body.password != req.body.confirm_password) {
          res.render('passwordReset', { message: 'Passwords do not match, please try again', time: req.params.time, id: req.params.id });
        } else {
          User.deleteOne({ _id: id })
            .then((result) => {
              User.register(updateUser, req.body.password, function (err, user) {
                if (err) {
                  console.log(err);
                  res.redirect("/");
                } else {
                  const message = {
                    to: foundUser.username,
                    from: 'bithostelhub@gmail.com',
                    subject: 'Password-reset successful',
                    html: '<h4>Your password has been successfully changed</h4>'
                  };
                  sgmail.send(message);
                  res.render('passwordReset', { message: 'Password successfully changed!', time: req.params.time, id: req.params.id });
                }
              });
            })
            .catch((err) => {
              console.log(err);
              res.redirect('/');
            });


        }

      } else {
        res.redirect('/');
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
app.post("/register", uploads, function (req, res) {
  const newUser = new User({
    name: req.body.name,
    room_no: req.body.room_no,
    hostel_no: req.body.hostel_no,
    roll_no: req.body.roll_no,
    phone: req.body.phone,
    username: req.body.username,
    image: req.file.filename,
  });


  if (req.body.password !== req.body.confirm_password) {
    res.render('register', { message: 'Password does not match', user: newUser });

  }
  else {
    if (req.body.password.length < 6) {
      res.render('register', { message: 'Password must be atleast 6 characters long', user: newUser });

    } else if (req.body.phone.length < 10 || req.body.phone.length > 10) {
      res.render('register', { message: 'Please enter a valid 10 digit phone no.', user: newUser });
    }
    else {
      User.findOne({ username: req.body.username }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            res.render('register', { message: 'User already exists', user: newUser });

          } else {
            User.register(newUser, req.body.password, function (err, user) {
              if (err) {
                res.redirect("/register");
              } else {
                res.render('register', { message: 'Successfully registered, you will be shortly notified about your verification status through your mail', user: {} });
                const message = {
                  to: newUser.username,
                  from: 'bithostelhub@gmail.com',
                  subject: 'Hello ' + newUser.name,
                  html: '<h3>Hello from hostelhub</h3>'
                };
                sgmail.send(message);
              }
            });
          }
        }
      });
    }
  }
});
let user;
app.post("/", passport.authenticate('local', { failWithError: true }), function (req, res) {


  user = new User({
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
            if (foundUser._id == '5fb7af22fab702482491d9e0') {
              passport.authenticate("local")(req, res, function () {

                if (err) {
                  console.log(err);
                } else {
                  res.redirect("/adminDashboard");
                }
              });
            } else {
              if (foundUser.verify) {
                passport.authenticate("local")(req, res, function () {

                  if (err) {
                    console.log(err);
                  } else {
                    res.redirect("/dashboard");
                  }
                });
              } else {
                res.render('home', { message: 'User is not yet verified please try again later', user: user });
              }
            }


          }
        }
      });

    }
  });
}, function (err, req, res, next) {
  user = new User({
    username: req.body.username,
    password: req.body.password
  });
  return res.render('home', { message: 'Username or password is incorrect', user: user });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
