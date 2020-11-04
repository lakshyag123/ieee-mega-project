//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require('bcrypt');
const saltRounds = 10;
let check = false;
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const multer = require('multer')
const upload = multer({ dest: 'public/uploads/' })
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
  hostel_no: String,
  room_no: String,
  roll_no: String,
  username: String,
  verify: false,
  password: String,
  contact_no: String
});
const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
const Admin = new mongoose.model("Admin", adminSchema);
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
app.get('/adminLogin', function (req, res) {
  res.render('admin');
});
app.get('/admin', function (req, res) {
  if (check) {
    User.find({}, function (err, foundUsers) {
      res.render('adminPage', { members: foundUsers });
    });

  } else {
    res.redirect('/adminLogin');
  }
});
app.get('/admin/:id', function (req, res) {
  if (check) {
    User.findOne({ _id: req.params.id }, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          res.render('verifyUsers', { foundUser: foundUser });
        }
      }
    });
  } else {
    res.redirect('/adminLogin');
  }
});
app.post('/admin/:id', function (req, res) {
  User.findOne({ _id: req.params.id }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.verify = true;
        foundUser.save();
        res.redirect('/admin');
      }
    }
  });
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
app.get('/adminLogout', function (req, res) {
  check = false;
  res.redirect('/adminLogin');
})
app.post("/register", function (req, res) {
  const newUser = new User({ name: req.body.name, hostel_no: req.body.hostel_no, room_no: req.body.room_no, roll_no: req.body.roll_no, contact_no: req.body.contact_no, username: req.body.username, verify: false });
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
          User.register(newUser, req.body.password, function (err, user) {
            if (err) {
              console.log(err);
              res.redirect("/register");
            } else {
              res.render("regSuccess");
            }
          });
        }
      }
    });

  }
});
app.post('/adminLogin', function (req, res) {
  // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     const admin = new Admin({
  //       username: req.body.username,
  //       password: hash
  //     });
  //     admin.save(function (err) {
  //       if (err) {
  //         console.log(err);
  //       } else {
  //         console.log('registered successfully');
  //       }
  //     });
  //   }
  // });
  Admin.findOne({ username: req.body.username }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        bcrypt.compare(req.body.password, foundUser.password, function (err, result) {
          if (result) {
            check = true;
            res.redirect('/admin');
          } else {
            res.send('Your password is incorrect');
          }
        });
      } else {
        res.send('You do not have permission');
      }
    }
  });

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
