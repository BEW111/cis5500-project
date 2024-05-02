var express = require('express');

var router = express.Router();

var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
const mysql = require("mysql");
const config = require("../config.json");
const dotenv = require("dotenv").config();
var LocalStrategy = require('passport-local');
var crypto = require('crypto');

// Creates MySQL connection using database credential provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = mysql.createConnection({
  host: process.env.RDS_HOST,
  user: config.rds_user,
  password: process.env.RDS_PASSWORD,
  port: config.rds_port,
  database: config.rds_db,
});
connection.connect((err) => err && console.log(err));

// var db = require('../db');

// router.get('/login', function(req, res, next) {
//   res.redirect('http://localhost:3000/login');
// });

router.get('/login/federated/google', passport.authenticate('google'));


router.post('/login/password', (req, res, next) => {
  console.log('POST request received on /login/password');
  next();
}, passport.authenticate('local'), (req, res) => {
  res.redirect(`http://localhost:3000?user=${JSON.stringify(req.user)}`);
});

passport.serializeUser(function(user, done) {
  // console.log("\n\n\nSerialize User!!!\n");
  // console.log(user);
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  console.log("\n\n\nDE-Serialize User!!!\n\n\n")

  connection.query("SELECT * FROM users WHERE id = ? ", [id], 
    function(err, rows){
      done(err, rows[0]);
    });
});


passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: [ 'profile' ]
}, function verify(issuer, profile, cb) {
  // console.log("\n\n\nINSIDE VERIFY!!!!\n\n\n");
  connection.query('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [issuer, profile.id], function(err, results) {
    if (err) { return cb(err); }
    if (results.length === 0) {
      connection.query('INSERT INTO users (name) VALUES (?)', [profile.displayName], function(err, results) {
        if (err) { return cb(err); }

        var id = results.insertId;
        connection.query('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [id, issuer, profile.id], function(err, results) {
          if (err) { return cb(err); }
          var user = {
            id: id,
            name: profile.displayName
          };
          return cb(null, user);
        });
      });
    } else {
      connection.query('SELECT * FROM users WHERE id = ?', [results[0].user_id], function(err, results) {
        if (err) { return cb(err); }
        if (results.length === 0) { return cb(null, false); }
        return cb(null, results[0]);
      });
    }
  });
}
));

router.get('/oauth2/redirect/google', passport.authenticate('google'), (req, res) => {
  res.redirect(`http://localhost:3000?user=${JSON.stringify(req.user)}`);
});

// Standard log in below
passport.use(new LocalStrategy(function verify(username, password, cb) {
  console.log("\nEnter Standard Login\n");
  console.log(username);
  console.log(password);
  connection.query('SELECT * FROM users WHERE name = ?', [ username ], function(err, results) {
    if (err) { console.log("\tErr 1 ", err); return cb(err); }
    if (results.length === 0) { console.log("\nNo match, Incorrect username.\n"); return cb(null, false, { message: 'Incorrect username.' }); }

    var row = results[0];
    crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
      if (err) { console.log("\tErr 2 ", err); return cb(err); }
      isEqual = crypto.timingSafeEqual(Buffer.from(row.hashed_password, 'hex'), hashedPassword);
      if (isEqual) {
        console.log("!equal password\n\tpasswords: ", row.hashed_password, hashedPassword, " isEqual ", isEqual); 
        return cb(null, false, { message: 'Incorrect username or password.' });
      }
      return cb(null, row);
    });
  });
}));

router.post('/signup', function(req, res, next) {
  const salt = crypto.randomBytes(16).toString('hex'); // Ensure salt is a string for storage
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
      if (err) { return next(err); }
      const hashedPasswordHex = hashedPassword.toString('hex'); // Convert to hex string for storage

      connection.query('INSERT INTO users (name, hashed_password, salt) VALUES (?, ?, ?)', [
          req.body.username, // assuming 'name' is used as the username field in your table
          hashedPasswordHex,
          salt
      ], function(err, results) {
          if (err) { return next(err); }
          var user = {
              id: results.insertId,
              username: req.body.username
          };
          req.login(user, function(err) {
              if (err) { return next(err); }
              res.redirect('http://localhost:3000'); // Redirect to home or dashboard as needed
          });
      });
  });
});


module.exports = router;

