const urlJoin = require('url-join')

const SPOTIFY_PLAYLISTS_EXTENDED_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID
const REDIRECT_URI =
  process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_PRODUCTION_URL
    : 'http://localhost:3000'

export default function performAuthorizeRedirect() {
  let hashParams = {}
  let e,
    r = /([^&;=]+)=?([^&;]*)/g,
    q = window.location.hash.substring(1)
  while ((e = r.exec(q))) {
    hashParams[e[1]] = decodeURIComponent(e[2])
  }

  if (!hashParams.access_token) {
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_PLAYLISTS_EXTENDED_CLIENT_ID}&scope=playlist-read-private%20playlist-read-collaborative%20playlist-modify-public%20user-read-recently-played%20playlist-modify-private%20ugc-image-upload%20user-follow-modify%20user-follow-read%20user-library-read%20user-library-modify%20user-read-private%20user-read-email%20user-top-read%20user-read-playback-state&response_type=token&redirect_uri=${REDIRECT_URI}`
  } else {
    this.setState({accessToken: hashParams.access_token})
  }
}
