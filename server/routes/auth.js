var express = require('express');

var router = express.Router();

var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
const mysql = require("mysql");
const config = require("../config.json");
const dotenv = require("dotenv").config();

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

router.get('/login', function(req, res, next) {
  res.redirect('http://localhost:3000/login');
});

router.get('/login/federated/google', passport.authenticate('google'));

passport.serializeUser(function(user, done) {
  console.log("\n\n\nSerialize User!!!\n");
  console.log(user);
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
  console.log("\n\n\nINSIDE VERIFY!!!!\n\n\n");
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

module.exports = router;

