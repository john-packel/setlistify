const db = require('../config/db');

module.exports = {
  save(params) {
    return db.one('insert into users(access_token, spotify_user_id) values(${accessToken}, ${spotifyUserId}) returning *', params);
  },

  all() {
    return db.any('select * from users');
  },

  findById(id) {
    return db.oneOrNone('select * from users where id = $1', id);
  },

  findBySpotityUserId(id) {
    return db.oneOrNone('select * from users where spotify_user_id = $1', id);
  }
};
