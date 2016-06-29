const axios = require('axios');
const env = require('./env');

const API_BASE = 'https://api.spotify.com/v1';

class SpotifyApi {
  constructor() {
    // For unauthenticated users we can use a client credentials token instead
    // of an OAuth2 access token. These tokens are short-lived and can't perform
    // actions on a user's behalf, but do the trick for endpoints like /search.
    // Relevant API methods will use client credentials tokens as a fallback if
    // no OAuth2 token is available.
    this.clientCredentialsToken = null;
  }

  search({ q, type, accessToken }) {
    const url = `${API_BASE}/search?q=${q}&type=${type}`;
    if (accessToken) {
      return axios({
        url,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
    }
    return axios({
      url,
      headers: {
        'Authorization': `Bearer ${this.clientCredentialsToken}`
      }
    }).catch(err => {
      if (err.response.status === 401) {
        return this.getNewClientCredentialsToken().then(() => {
          return axios({
            url,
            headers: {
              'Authorization': `Bearer ${this.clientCredentialsToken}`
            }
          });
        });
      }
    });
  }

  createPlaylist({ spotifyUserId, playlistName, accessToken }) {
    return axios({
      url: `${API_BASE}/users/${spotifyUserId}/playlists`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        name: playlistName
      }
    });
  }

  addTracksToPlaylist({ userId, playlistId, uris, accessToken }) {
    return axios({
      url: `${API_BASE}/users/${userId}/playlists/${playlistId}/tracks`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        uris
      }
    });
  }

  getNewClientCredentialsToken() {
    return axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': `Basic ${(new Buffer(`${env.spotifyClientId}:${env.spotifyClientSecret}`).toString('base64'))}`
      },
      params: {
        grant_type: 'client_credentials' // eslint-disable-line
      }
    }).then(resp => {
      this.clientCredentialsToken = resp.data.access_token;
    }).catch(err => {
      const errMessage = err.response && err.response.data.error || err.message;
      console.error('Error attempting to create Spotify client creditals token: ', errMessage);
    });
  }
}

module.exports = SpotifyApi;
