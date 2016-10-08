const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const logger = require('morgan');
const cookieSession = require('cookie-session');
const passport = require('passport');

const SpotifyApi = require('./spotify');
const User = require('./models/user');

require('./config/db'); // Create initial database connection
require('./config/passport')(passport);

const app = express();

if (process.env.NODE_ENV !== 'production') {
  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const config = require('../../webpack.config.dev');
  const compiler = webpack(config);
  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }));
  app.use(webpackHotMiddleware(compiler));
} else {
  app.use('/public', express.static(path.join(__dirname, '../../dist')));
}

const spotifyApi = new SpotifyApi();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger('dev'));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/spotify', passport.authenticate('spotify'));

app.get('/callback',
  passport.authenticate('spotify'),
  (req, res) => {
    res.redirect('/');
  });

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.get('/api/v0/setlist', (req, res, next) => {
  const { url } = req.query;
  axios.get(url).then(resp => {
    res.json(resp.data);
  }).catch(err => {
    next(err);
  });
});

app.get('/api/v0/search', (req, res, next) => {
  const { q, type } = req.query;
  spotifyApi.search({ q, type }).then(resp => {
    res.json(resp.data);
  }).catch(err => {
    next(err);
  });
});

app.post('/api/v0/playlists', loggedIn, (req, res, next) => {
  const {
    body: { uris, name },
    user
  } = req;
  let accessToken;
  User.findById(user.id).then(data => {
    accessToken = data.accessToken;
    return spotifyApi.createPlaylist({
      spotifyUserId: data.spotifyUserId,
      playlistName: name,
      accessToken: data.accessToken
    });
  }).then(resp => {
    const playlistId = resp.data.id;
    return spotifyApi.addTracksToPlaylist({
      userId: 0,
      playlistId,
      uris,
      accessToken
    });
  }).then(resp => {
    res.status(201).json(resp.data);
  }).catch(err => {
    next(err);
  });
});

app.get('/api/v0/me', loggedIn, (req, res, next) => {
  User.findById(req.user.id).then(user => {
    res.json({ user });
  }).catch(err => {
    next(err);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.use((err, req, res) => {
  console.error('Error: ', err.stack);
  res.status(500).json({
    error: err.message
  });
});

function loggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({error: 'unauthenticated'});
}

app.listen(3000, (err) => {
  if (err) {
    console.log(err);
    return;
  }

  console.log('Listening at http://localhost:3000');
});
