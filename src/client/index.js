import axios from 'axios';
import _ from 'lodash';
import './app.scss';

const setlistForm = document.querySelector('.js-setlistfm-form');
setlistForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const url = setlistForm.elements[0].value;
  axios.get(`/api/v0/setlist?url=${url}`).then(resp => {
    const doc = parseRawHTML(resp.data);
    const tracks = getTracks(doc);
    const artistName = getArtist(doc);
    renderPlaylistPreview(tracks, artistName);
    searchArtist();
    searchTracks();
  }).catch(err => {
    console.error('Something went wrong: ', err.message);
  });
});

const spotifyClient = {
  search({ query, type = 'track' }) {
    return axios.get(`/api/v0/search?q=${encodeURIComponent(query)}&type=${type}`);
  },

  createPlaylist({ name, uris }) {
    return axios({
      url: '/api/v0/playlists',
      method: 'post',
      data: {
        name,
        uris
      }
    });
  }
};

function parseRawHTML(raw) {
  const parser = new DOMParser();
  return parser.parseFromString(raw, 'text/html');
}

function getTracks(doc) {
  const tracks = doc.querySelectorAll('.setlistList ol li .songPart a');
  return Array.from(tracks).map(track => track.textContent);
}

function getArtist(doc) {
  return doc.querySelector('.setlistHeadline a span').textContent;
}

function renderPlaylistPreview(trackNames, artistName) {
  const $tracks = parseHTML(renderTracks({ tracks: trackNames }));
  bindTrackEvents($tracks);
  const $artist = parseHTML(renderArtist({ name: artistName }));
  const container = document.querySelector('.playlist-preview');
  container.appendChild($artist);
  container.appendChild($tracks);
}

function renderArtist({ name }) {
  return (
    `<div class="artist">
      <h2>
        ${name}
      </h2>
    </div>`
  );
}

function renderTracks({ tracks }) {
  return (
    `<form class="tracks">
      ${tracks.map(t => renderTrack({ name: t })).join('')}
      <input type="submit" class="create-playlist">Create Playlist</input>
    </form>`
  );
}

function renderTrack({ name }) {
  return (
    `<div class="panel">
       <div class="track">
        <li class="track-name">${name}</li>
        <div class="track-status">loading</div>
      </div>
    </div>`
  );
}

function bindTrackEvents($tracks) {
  $tracks.addEventListener('submit', (e) => {
    e.preventDefault();
    const validTracks = Array.from(document.querySelectorAll('.track.success'));
    const uris = validTracks.map(node => node.dataset.spotifyUri);
    spotifyClient.createPlaylist({
      uris,
      name: 'FIXME'
    });
  });
}

function searchTracks() {
  const $tracks = Array.from(document.querySelectorAll('.track'));
  const artistName = document.querySelector('.artist').textContent.trim();

  $tracks.forEach($track => {
    const name = $track.querySelector('.track-name').textContent.trim();
    const $status = $track.querySelector('.track-status');
    spotifyClient.search({
      query: `${name}+artist:${artistName}`,
      type: 'track'
    }).then(resp => {
      // It's not uncommon for a track search to return multiple results.
      // This isn't doing anything special yet and just picks the first item.
      // Eventually users should be able to pick between options.
      const foundTrack = _.get(resp, 'data.tracks.items[0]', null);
      if (foundTrack) {
        $status.textContent = 'Found it :D';
        $track.classList.add('success');
        $track.dataset.spotifyUri = foundTrack.uri;
      } else {
        $status.textContent = 'Didn\'t find it :(';
        $track.classList.remove('success');
      }
    }).catch(err => {
      console.log('Error searching for track', err.toString());
      $status.textContent = `Something went wrong! ${err.toString()}`;
    });
  });
}

function searchArtist() {
  const $artist = document.querySelector('.artist');
  spotifyClient.search({ type: 'artist', query: $artist.textContent }).then(() => {
    // TODO
  }).catch(err => {
    console.log('failed with: ', err.message);
  });
}

function parseHTML(htmlString) {
  var d = document.createElement('div');
  d.innerHTML = htmlString.trim();
  return d.firstChild;
}
