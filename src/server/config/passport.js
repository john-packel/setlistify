const SpotifyStrategy = require('passport-spotify').Strategy;
const User = require('../models/user');
const env = require('../env');

module.exports = (passport) => {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function(id, done) {
    User.findById(id).then(user => {
      done(null, user);
    }).catch(err => {
      done(err, null);
    });
  });

  passport.use(new SpotifyStrategy({
    clientID: env.spotifyClientId,
    clientSecret: env.spotifyClientSecret,
    callbackURL: 'http://localhost:3000/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    User.findBySpotityUserId(profile.id).then(user => {
      if (user) {
        return done(null, user);
      }

      User.save({ accessToken, spotifyUserId: profile.id }).then(user => {
        return done(null, user);
      }).catch(done);
    }).catch(done);
  }));
};
