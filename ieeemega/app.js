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
const mailgun = require('mailgun-js');
const API_KEY = process.env.API_KEY;
const dateTime = require('node-datetime');
const DOMAIN = process.env.DOMAIN;  //i will give the api key
const multer = require('multer');
// const e = require('express');
var moment = require('moment');
const methodOverride = require("method-override");
const Poll = require('./models/poll');
const upload = multer({ dest: 'public/uploads/' })
mongoose.Promise = Promise;
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
app.use(methodOverride("_method"));
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useFindAndModify: false });  // i will give the mongodb server url
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
  room_no: Number,
  hostel_no: String,
  roll_no: String,
  phone: String,
  username: String,
  password: String,
  image: String,
  verify: Boolean,
  pollverify: Boolean
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// attendance schema
const hostelattendschema = new mongoose.Schema({
  userId: String,
  user: String,
  roll_no: String,
  hostel_no: String,
  room_no: Number,
  intime: String,
  outtime: String,
  outdate: String,
  indate: String
});
const messschema = new mongoose.Schema({
  userId: String,
  user: String,
  roll_no: String,
  hostel_no: String,
  room_no: Number,
  food: String,
  date: String
});
const feedSchema = new mongoose.Schema({
  userId: String, user: String, roll_no: String, hostel_no: String, phone: String, room_no: Number, query: String, body: String, verify: Boolean, username: String
});
const complaintSchema = new mongoose.Schema({
  userId: String,
  user: String,
  roll_no: String,
  hostel_no: String,
  phone: String,
  room_no: Number,
  title: String,
  body: String,
  verify: Boolean,
  username: String
});
const cartSchema = new mongoose.Schema({
  userid: String,
  qty1: String,
  qty2: String,
  qty3: String,
  amount: String,
  created: {
    type: Date,
    default: Date.now
  }
});
const Cart = mongoose.model("Cart", cartSchema);
const Messtime = new mongoose.model('Messtime', messschema);
const Timing = new mongoose.model('Timing', hostelattendschema);
const Feedback = new mongoose.model("Feedback", feedSchema);
const HostelComplaint = new mongoose.model("HostelComplaint", complaintSchema);
const MessComplaint = new mongoose.model("MessComplaint", complaintSchema);

app.get("/", (req, res) => {
  res.render('welcome.ejs');
});
app.get('/home', function (req, res) {
  res.render('home.ejs', { message: '', user: '' });
});
app.get('/register', function (req, res) {
  res.render('register.ejs', { message: '', user: '' });
});
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect('/home');
});
app.get("/dashboard", function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      User.find({ username: req.user.username }, function (err, found) {
        if (err) {
          console.log(err);
        } else {
          if (found) {
            res.render('dashboard.ejs');
          }
        }
      });
    } else {
      res.redirect('/logout');
    }

  } else {
    res.redirect('/home');
  }
});
//poll
app.get('/poll', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {

      Poll.find({}, (err, polls) => {
        if (err) {
          console.log(err);
        } else {
          if (polls) {
            if (req.user.pollverify == null) {
              res.render('foodpoll.ejs', { polls: polls, check: 'yes' });
            } else {
              res.render('foodpoll.ejs', { polls: polls, check: '' });
            }
          }
        }

      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

});

app.post('/poll', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      req.user.pollverify = true;
      req.user.save((err, result) => {
        if (err) {
          console.log(err);
        } else {
          const query = req.body;
          for (const element in query) {
            Poll.findOne({ _id: element }, function (err, foundVote) {
              if (err) {
                console.log(err);
              } else {
                if (foundVote) {
                  foundVote.choices[query[element]].votes = foundVote.choices[query[element]].votes + 1;
                  foundVote.save();
                }
              }
            });
          }
          res.render('pollvotesuccess.ejs');
        }
      });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.get('/adminpollresults', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      Poll.find({}, (err, polls) => {
        if (err) {
          console.log(err);
        } else {
          if (polls) {
            res.render('adminpollresults', { polls: polls });
          }
        }

      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});

//laundry
const items = [
  {
    "id": 1,
    "name": "Jeans",
    "price": 2000,
    "imgName": "jeans.jpg"
  },
  {
    "id": 2,
    "name": "Shirt",
    "price": 1000,
    "imgName": "shirt.jpg"
  },
  {
    "id": 3,
    "name": "Jacket/Woolen",
    "price": 3000,
    "imgName": "jacket.jpg"
  }
]
app.get('/laundry', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      res.render("laundry", { items: items });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

})

app.get("/laundry/history", function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      Cart.find({ userid: req.user._id }, function (err, cart) {
        if (err) console.log(err);
        else {
          res.render("history", { cart: cart });
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

})

app.post('/laundry', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      const cart = new Cart({
        userid: req.user._id,
        qty1: req.body.cart.qty1,
        qty2: req.body.cart.qty2,
        qty3: req.body.cart.qty3
      })
      cart.save((err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/laundry/history");
        }
      });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

});

//edit
app.get("/laundry/:id/edit", function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      Cart.findById(req.params.id, function (err, cart) {
        if (err) {
          res.redirect("/laundry/history");
        } else {
          res.render("edit", { cart: cart });
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

})

//update
app.put("/laundry/:id", function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      Cart.findByIdAndUpdate(req.params.id, req.body.cart, function (err, cart) {
        if (err) {
          res.redirect("/laundry/history");
        } else {
          res.redirect("/laundry/history");
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

})

//delete
app.delete("/laundry/:id", function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      Cart.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
          res.redirect("/laundry/history");
        } else {
          res.redirect("/laundry/history");
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

})
app.get('/adminDashboard', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      res.render('adminhome.ejs');
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
})
app.get('/adminhostelattendance', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      res.render('adminhostelattend.ejs', { members: '', checker: 'hostelattendance', numb: '' });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.get('/adminmessattendance', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      res.render('adminmessattend.ejs', { members: '', checker: 'hostelattendance', numb: '', message: '', kal: '' });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.post('/adminmessattendance', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const hostelno = req.body.hostelsearch;
      var dt = dateTime.create();
      var formattedDate = dt.format('d-m-Y');
      User.find({ _id: { $ne: '5fb7af22fab702482491d9e0' } }, function (err, foundUsers) {
        if (err) {
          console.log(err);
        } else {
          if (foundUsers) {

            for (let i = 0; i < foundUsers.length; i++) {

              Messtime.findOne({ userId: foundUsers[i]._id, hostel_no: hostelno, date: formattedDate }).catch((error) => {
                console.log(error);
              })
                .then((foundUser) => {
                  if (!foundUser) {
                    if (foundUsers[i].verify == true) {
                      if (foundUsers[i].hostel_no == hostelno) {
                        const usermess = new Messtime({
                          userId: foundUsers[i]._id,
                          user: foundUsers[i].name,
                          roll_no: foundUsers[i].roll_no,
                          hostel_no: foundUsers[i].hostel_no,
                          room_no: foundUsers[i].room_no,
                          food: 'absent',
                          date: formattedDate
                        });
                        usermess.save();
                      }
                    }
                  }

                })
            }
            res.render('adminmessattend.ejs', { checker: 'hostelfoundpost', members: {}, numb: hostelno, message: 'Enter the required date to check the attendance list', kal: '' });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.post('/adminmessroll/:no', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const hostelno = req.params.no;
      const tareeq = req.body.datesearch;
      Messtime.find({ hostel_no: hostelno, date: tareeq }, function (err, foundUsers) {
        if (err) {
          console.log(err);
        } else {
          if (foundUsers) {
            res.render('adminmessattend.ejs', { checker: 'hostelfoundpost', members: foundUsers, numb: hostelno, message: 'No data for this date available', kal: tareeq });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
})
app.get('/messattend', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      res.render('messattend.ejs', { message: '' });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.post('/messattend', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      const info = req.body.radio_1;
      var dt = dateTime.create();
      var formattedDate = dt.format('d-m-Y');
      Messtime.findOne({ userId: req.user._id, date: formattedDate }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            if (foundUser.food == 'absent') {
              foundUser.food = 'present';
              foundUser.save();
              res.render('messattend.ejs', { message: 'Your attendance has been marked' })
            } else {
              res.render('messattend.ejs', { message: 'You have already marked your attendance for today, come tomorrow!' });
            }
          } else {
            const usermess = new Messtime({
              userId: req.user._id,
              user: req.user.name,
              roll_no: req.user.roll_no,
              hostel_no: req.user.hostel_no,
              room_no: req.user.room_no,
              food: 'present',
              date: formattedDate
            });
            usermess.save();
            res.render('messattend.ejs', { message: 'your attendance has been marked' });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
})
app.post('/adminhostelattendance', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const hostelno = req.body.hostelsearch;
      Timing.find({ hostel_no: hostelno }, function (err, foundUsers) {
        if (err) {
          console.log(err);
        } else {
          if (foundUsers) {
            res.render('adminhostelattend.ejs', { checker: 'hostelfoundpost', members: foundUsers, numb: hostelno });
          }
        }
      }).sort({ room_no: 1 });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
})
app.get('/adminverifyuser', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      User.find({}, function (err, foundUsers) {
        if (err) {
          console.log(err);
        } else {
          res.render('adminPage.ejs', { members: foundUsers, checker: 'userverify' });
        }
      });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
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
            res.render('verifyUsers.ejs', { user: foundUser });
          }
        }
      });
    } else {
      res.redirect('/logout');
    }

  } else {
    res.redirect('/home');
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
            var dt = dateTime.create();
            var formattedDate = dt.format('d-m-Y');
            const khalofriends = new Messtime({
              userId: foundUser._id,
              user: foundUser.name,
              roll_no: foundUser.roll_no,
              hostel_no: foundUser.hostel_no,
              room_no: foundUser.room_no,
              food: 'absent',
              date: formattedDate
            });
            khalofriends.save();
            const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
            const data = {
              from: 'hostel@hostelhub.megaproject.me',
              to: foundUser.username,
              subject: 'Account verified successfully!',
              html: `<h1> Hello ${foundUser.name}</h1>
            <p><h4>Your account has been successfully verified and your account has been activated.</h4></p>`
            };
            mg.messages().send(data, function (error, body) {
              if (error) {
                console.log(error);
              } else {
                res.redirect('/adminverifyuser');
              }
            });


          }
        }
      });
    } else {
      res.redirect('/logout');
    }

  } else {
    res.redirect('/home');
  }
});
//db for complaint box

// hostelattendance

app.get('/hostelattend', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      Timing.findOne({ userId: req.user._id, intime: '' }, (err, foundUser) => {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            res.render('hostelattend.ejs', { message: 'coming in' });
          } else {
            Timing.findOne({ userId: req.user._id }, (error, founduser) => {
              if (error) {
                console.log(error);
              } else {
                if (founduser) {
                  res.render('hostelattend.ejs', { message: 'going out' });
                } else {
                  res.render('hostelattend.ejs', { message: 'going out' });
                }
              }
            })
          }
        }
      })
    } else {
      res.redirect('/logout');
    }

  } else {
    res.redirect('/home');
  }

});
//get the check in and check out details of a particular user
app.post('/adminhostelroll/:no', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const receiveroll = req.body.rollsearch;
      const hostelno = req.params.no;
      Timing.find({ room_no: receiveroll, hostel_no: hostelno }, function (err, foundData) {
        if (err) {
          console.log(err, 'here1');
        } else {
          if (foundData) {
            res.render('adminhostelattend.ejs', { members: foundData, checker: 'hostelattendancepost', numb: hostelno });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
//
app.post('/hostelattend', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      var dt = dateTime.create();
      var formattedDate = dt.format('d-m-Y');
      var formattedTime = dt.format('H:M:S');
      var purpose;
      purpose = req.body.radio_1;
      if (purpose == 'Out-of-Hostel') {
        const outtime = new Timing({
          userId: req.user._id,
          user: req.user.name,
          roll_no: req.user.roll_no,
          hostel_no: req.user.hostel_no,
          room_no: req.user.room_no,
          outtime: formattedTime,
          intime: '',
          outdate: formattedDate,
          indate: ''
        });
        outtime.save((err) => {
          if (err) {
            console.log(err);
          } else {
            res.render('hostelattend.ejs', { message: 'coming in' });
          }
        });

      } else {
        Timing.findOne({ userId: req.user._id, intime: '' }, (err, foundUser) => {
          if (err) {
            console.log(err);
          } else {
            if (foundUser) {
              foundUser.intime = formattedTime;
              foundUser.indate = formattedDate;
              foundUser.save((err) => {
                if (err) {
                  console.log(err);
                } else {
                  res.render('hostelattend.ejs', { message: 'going out' });
                }
              });
            }
          }
        });
      }
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }



});
// about hostel route
app.get('/abouthostel', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      res.render('abouthostel.ejs');
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

});
//schema

//feedback route
app.get('/feedback', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      res.render('feedback.ejs', { message: '' });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

});
app.post('/feedback', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      const userid = req.user._id;
      const Query = req.body.query;
      const Body = req.body.body;
      const feedback = new Feedback({
        userId: userid,
        user: req.user.name,
        roll_no: req.user.roll_no,
        hostel_no: req.user.hostel_no,
        phone: req.user.phone,
        room_no: req.user.room_no,
        query: Query,
        body: Body
      });
      feedback.save();
      const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
      const data = {
        from: 'hostel@hostelhub.megaproject.me',
        to: req.user.username,
        subject: 'Feedback received',
        html: `<h1> Hello ${req.user.name}</h1>
            <p><h3>Your valuable feedback for the developers has been received!!
            This is in lieu with the following feedback submitted by you
            <br>
            <br><p></h3>
            <p><h4><b>Feedback Title</b>: ${feedback.query}</p></h4>
            <p><h4><b>Feedback</b>: ${feedback.body}</p></h4>`
      };
      mg.messages().send(data, function (error, body) {
        if (error) {
          console.log(error);
        } else {
          res.render('feedback.ejs', { message: 'Feedback sent successfully' });
        }
      });

    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

});
app.get('/adminfeedback', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      Feedback.find({}, function (err, foundUsers) {
        if (err) {
          console.log(err);
        } else {
          res.render('adminfeedback.ejs', { members: foundUsers });
        }
      });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.get('/adminfeedback/:id', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const id = req.params.id;
      Feedback.findOne({ _id: id }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            res.render('adminfeedbackdetails.ejs', { member: foundUser });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
// complaint route
app.get('/complaint', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      res.render('complaint.ejs', { message: '' });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

});
app.post('/complaint', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      const userid = req.user._id;
      const Title = req.body.title;
      const Body = req.body.body;

      const hostelcomplaint = new HostelComplaint({
        userId: userid,
        user: req.user.name,
        roll_no: req.user.roll_no,
        hostel_no: req.user.hostel_no,
        phone: req.user.phone,
        room_no: req.user.room_no,
        title: Title,
        body: Body,
        username: req.user.username
      });
      hostelcomplaint.save();
      res.render('complaint.ejs', { message: 'Complaint sent successfully' });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

});
app.get('/adminhostelcomplaint', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      HostelComplaint.find({}, function (err, foundUsers) {
        if (err) {
          console.log(err);
        } else {
          if (foundUsers) {
            res.render('adminhostelcomplaint.ejs', { members: foundUsers });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.post('/adminhostelnohostel', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const hostelno = req.body.hostelsearch;
      HostelComplaint.find({ hostel_no: hostelno }, function (err, foundUsers) {
        if (err) {
          console.log(err);
        } else {
          if (foundUsers) {
            res.render('adminhostelcomplaint.ejs', { members: foundUsers });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.get('/adminhostelcompdetails/:id', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const id = req.params.id;
      HostelComplaint.findOne({ _id: id }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            res.render('adminhostelcompdetails.ejs', { member: foundUser });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.post('/adminhostelcompdetails/:id', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const id = req.params.id;
      HostelComplaint.findOne({ _id: id }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            foundUser.verify = true;
            foundUser.save();
            const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
            const data = {
              from: 'hostel@hostelhub.megaproject.me',
              to: foundUser.username,
              subject: 'Regarding Hostel complaint',
              html: `<h1> Hello ${foundUser.user}</h1>
            <p><h3>Your Hostel complaint has been noted down and will be resolved as soon as possible.</p></h3>
            <p><h4>This is in lieu with the following complaint</p></h4>
            <p><h4><b>Complaint Title</b>: ${foundUser.title}</p></h4>
            <p></h4><b>Complaint</b>: ${foundUser.body}</p></h4>`
            };
            mg.messages().send(data, function (error, body) {
              if (error) {
                console.log(error);
              } else {
                res.redirect('/adminhostelcomplaint');
              }
            });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.post('/rejectedhostel/:id', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const id = req.params.id;
      HostelComplaint.findOne({ _id: id }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            foundUser.verify = false;
            foundUser.save();
            const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
            const data = {
              from: 'hostel@hostelhub.megaproject.me',
              to: foundUser.username,
              subject: 'Regarding Mess complaint',
              html: `<h1> Hello ${foundUser.user}</h1>
            <p><h3>We are sorry but your complaint was not found appropriate or suitable in the current situation. You can contact your hostel warden for further details</p></h3>
            <p><h4>This is in lieu with the following complaint</p></h4>
            <p><h4><b>Complaint Title</b>: ${foundUser.title}</p></h4>
            <p></h4><b>Complaint</b>: ${foundUser.body}</p></h4>`
            };
            mg.messages().send(data, function (error, body) {
              if (error) {
                console.log(error);
              } else {
                res.redirect('/adminhostelcomplaint');
              }
            });
          }
        }
      });
    } else {
      res.redirect('/logout');
    }

  } else {
    res.redirect('/home');
  }
});
app.get('/complaintmess', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      res.render('complaintmess.ejs', { message: '' });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }

});
app.get('/adminmesscomplaint', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      MessComplaint.find({}, function (err, foundUsers) {
        if (err) {
          console.log(err);
        } else {
          if (foundUsers) {
            res.render('adminmesscomplaint.ejs', { members: foundUsers });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.post('/adminhostelnomess', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const hostelno = req.body.hostelsearch;
      MessComplaint.find({ hostel_no: hostelno }, function (err, foundUsers) {
        if (err) {
          console.log(err);
        } else {
          if (foundUsers) {
            res.render('adminmesscomplaint.ejs', { members: foundUsers });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.get('/adminmesscompdetails/:id', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const id = req.params.id;
      MessComplaint.findOne({ _id: id }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            res.render('adminmesscompdetails.ejs', { member: foundUser });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.post('/adminmesscompdetails/:id', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const id = req.params.id;
      MessComplaint.findOne({ _id: id }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            foundUser.verify = true;
            foundUser.save();
            const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
            const data = {
              from: 'hostel@hostelhub.megaproject.me',
              to: foundUser.username,
              subject: 'Regarding Mess complaint',
              html: `<h1> Hello ${foundUser.user}</h1>
            <p><h3>Your mess complaint has been noted down and will be resolved as soon as possible.</p></h3>
            <p><h4>This is in lieu with the following complaint</p></h4>
            <p><h4><b>Complaint Title</b>: ${foundUser.title}</p></h4>
            <p></h4><b>Complaint</b>: ${foundUser.body}</p></h4>`
            };
            mg.messages().send(data, function (error, body) {
              if (error) {
                console.log(error);
              } else {
                res.redirect('/adminmesscomplaint');
              }
            });
          }
        }
      })
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
  }
});
app.post('/rejectedmess/:id', function (req, res) {
  if (req.isAuthenticated()) {
    if (req.user._id == '5fb7af22fab702482491d9e0') {
      const id = req.params.id;
      MessComplaint.findOne({ _id: id }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            foundUser.verify = false;
            foundUser.save();
            const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
            const data = {
              from: 'hostel@hostelhub.megaproject.me',
              to: foundUser.username,
              subject: 'Regarding Mess complaint',
              html: `<h1> Hello ${foundUser.user}</h1>
            <p><h3>We are sorry but your complaint was not found appropriate or suitable in the current situation. You can contact your hostel warden for further details</p></h3>
            <p><h4>This is in lieu with the following complaint</p></h4>
            <p><h4><b>Complaint Title</b>: ${foundUser.title}</p></h4>
            <p></h4><b>Complaint</b>: ${foundUser.body}</p></h4>`
            };
            mg.messages().send(data, function (error, body) {
              if (error) {
                console.log(error);
              } else {
                res.redirect('/adminmesscomplaint');
              }
            });
          }
        }
      });
    } else {
      res.redirect('/logout');
    }

  } else {
    res.redirect('/home');
  }
});
app.post('/complaintmess', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user._id != '5fb7af22fab702482491d9e0') {
      const userid = req.user._id;
      const Title = req.body.title;
      const Body = req.body.body;

      const messcomplaint = new MessComplaint({
        userId: userid,
        user: req.user.name,
        roll_no: req.user.roll_no,
        hostel_no: req.user.hostel_no,
        phone: req.user.phone,
        room_no: req.user.room_no,
        title: Title,
        body: Body,
        username: req.user.username
      });
      messcomplaint.save();
      res.render('complaintmess.ejs', { message: 'Complaint sent successfully' });
    } else {
      res.redirect('/logout');
    }
  } else {
    res.redirect('/home');
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
            const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
            const data = {
              from: 'hostel@hostelhub.megaproject.me',
              to: foundUser.username,
              subject: 'Problem in account details',
              html: `<h1> Hello ${foundUser.name}</h1>
            <p><h4>The credentials entered by you in the registration form have some problems. Kindly contact the admin to verify your details and activate your account.</h4></p>`
            };
            mg.messages().send(data, function (error, body) {
              if (error) {
                console.log(error);
              } else {
                res.redirect('/adminDashboard');
              }
            });
          }
        }
      });
    } else {
      res.redirect('/logout');
    }

  } else {
    res.redirect('/home');
  }
});
app.get('/forgotpassword', function (req, res) {
  res.render('forgotpassword.ejs', { message: '' });
});
app.post('/forgotpassword', function (req, res) {
  User.findOne({ username: req.body.username }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {

        crypto.randomBytes(48, function (err, buffer) {
          const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
          const token = buffer.toString('hex');
          const data = {
            from: 'hostel@hostelhub.megaproject.me',
            to: foundUser.username,
            subject: 'Password-reset',
            html: `<h1> Hello ${foundUser.name}</h1>
            <p><h4>Click on the following link down below to reset your password, if the link was not requested by you, then don't click here</h4></p>
            <a href="http://localhost:3000/passwordReset/${token}/${foundUser._id}">Reset password link</a>`
          };
          mg.messages().send(data, function (error, body) {
            if (error) {
              console.log(error);
            } else {
              res.render('forgotpassword.ejs', { message: 'The reset link has been sent to the given mail Id' });
            }
          });
        });


      } else {
        res.render('forgotpassword.ejs', { message: 'The email Id is not registered' })
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
        res.render('passwordReset.ejs', { message: '', time: req.params.time, id: req.params.id });
      } else {
        res.redirect('/home');
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
            _id: foundUser._id,
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
            _id: foundUser._id,
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
          res.render('passwordReset.ejs', { message: 'Password must be atleast 6 characters long', time: req.params.time, id: req.params.id });
        } else if (req.body.password != req.body.confirm_password) {
          res.render('passwordReset.ejs', { message: 'Passwords do not match, please try again', time: req.params.time, id: req.params.id });
        } else {
          User.deleteOne({ _id: id })
            .then((result) => {
              User.register(updateUser, req.body.password, function (err, user) {
                if (err) {
                  console.log(err);
                  res.redirect('/home');
                } else {
                  const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
                  const data = {
                    from: 'hostel@hostelhub.megaproject.me',
                    to: foundUser.username,
                    subject: 'Password-reset successful!',
                    html: `<h1> Hello ${foundUser.name}</h1>
            <p><h4>Your password has been successfully updated!</h4></p>`
                  };
                  mg.messages().send(data, function (error, body) {
                    if (error) {
                      console.log(error);
                    } else {
                      res.render('passwordReset.ejs', { message: 'Password successfully changed!', time: req.params.time, id: req.params.id });
                    }
                  });

                }
              });
            })
            .catch((err) => {
              console.log(err);
              res.redirect('/home');
            });


        }

      } else {
        res.redirect('/home');
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
app.post('/register', uploads, function (req, res) {
  const newUser = new User({
    name: req.body.name,
    room_no: req.body.room_no,
    hostel_no: req.body.hostel_no,
    roll_no: req.body.roll_no,
    phone: req.body.phone,
    username: req.body.username,
    image: req.file.filename
  });


  if (req.body.password !== req.body.confirm_password) {
    res.render('register.ejs', { message: 'Password does not match', user: newUser });

  }
  else {
    if (req.body.password.length < 6) {
      res.render('register.ejs', { message: 'Password must be atleast 6 characters long', user: newUser });

    } else if (req.body.phone.length < 10 || req.body.phone.length > 10) {
      res.render('register.ejs', { message: 'Please enter a valid 10 digit phone no.', user: newUser });
    } else if (req.body.hostel_no < 1 || req.body.hostel_no > 14) {
      res.render('register.ejs', { message: 'Hostel No. must be a number between 1 to 14', user: newUser });
    }
    else {
      User.findOne({ username: req.body.username }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            res.render('register.ejs', { message: 'User already exists', user: newUser });

          } else {
            User.register(newUser, req.body.password)
              .catch((err) => {
                res.redirect("/register");
              })
              .then((user) => {
                res.render('register.ejs', { message: 'Successfully registered, you will be shortly notified about your verification status through your mail', user: {} });
                const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });
                const data = {
                  from: 'hostel@hostelhub.megaproject.me',
                  to: newUser.username,
                  subject: 'Hello ' + newUser.name,
                  html: `<p><h4>Hello from Hostel hub! Your account is inactive right now. After the verification of your registration details your account will be activated.</h4></p>`
                };
                mg.messages().send(data, function (error, body) {
                  if (error) {
                    console.log(error);
                  }
                });

              })
          }
        }
      });
    }
  }
});
let user;
app.post('/home', passport.authenticate('local', { failWithError: true }), function (req, res) {


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
                res.render('home.ejs', { message: 'User is not yet verified please try again later', user: user });
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
  return res.render('home.ejs', { message: 'Username or password is incorrect', user: user });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
