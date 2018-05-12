import React, {Component} from 'react'
import SwipeableBottomSheet from 'react-swipeable-bottom-sheet'
import _ from 'lodash'
import performAuthorizeRedirect from './performAuthorizeRedirect'
import './App.css'
import Api from './Api'
const SPOTIFY_PLAYLISTS_EXTENDED_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID
const REDIRECT_URI =
  process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_PRODUCTION_URL
    : 'http://localhost:3000'

const BORDER_RADIUS = 0
const Colors = {
  gray10: 'hsl(213, 13%, 16%)', // primary text
  gray50: 'hsl(210, 9%, 38%);', // secondary text
  gray65: 'hsl(215, 8%, 45%)', // placeholder
  gray85: 'hsl(216, 18%, 84%)', // icons secondary
  gray95: 'hsl(192, 22%, 95%)', // backgrounds, borders
}

const MOCK = true
const MOCK_DETAIL = {
  collaborative: false,
  external_urls: {
    spotify: 'https://open.spotify.com/user/1121764585/playlist/0cCOW5iIG21lvkCoCTSjqZ',
  },
  href: 'https://api.spotify.com/v1/users/1121764585/playlists/0cCOW5iIG21lvkCoCTSjqZ',
  id: '0cCOW5iIG21lvkCoCTSjqZ',
  images: [
    {
      height: 640,
      url: 'https://i.scdn.co/image/488632a546b008aa2c75489c01c64ca62ae26a20',
      width: 640,
    },
  ],
  name: 'Kwabs – Wrong Or Right EP .sw ?',
  owner: {
    display_name: 'Jonathan Werner',
    external_urls: {
      spotify: 'https://open.spotify.com/user/1121764585',
    },
    href: 'https://api.spotify.com/v1/users/1121764585',
    id: '1121764585',
    type: 'user',
    uri: 'spotify:user:1121764585',
  },
  primary_color: null,
  public: false,
  snapshot_id: 'dci2NwxZzAZve6BuPCSng4s5nPmQg6yQv2gdCsHP75XnTkI3DVjpzCNjNbn6oWGP',
  tracks: {
    href: 'https://api.spotify.com/v1/users/1121764585/playlists/0cCOW5iIG21lvkCoCTSjqZ/tracks',
    total: 4,
  },
  type: 'playlist',
  uri: 'spotify:user:1121764585:playlist:0cCOW5iIG21lvkCoCTSjqZ',
}

const REVIEW = `The Sea and Cake have been so consistent and so singular for so long that the words “taken for granted” now turn up in their reviews as much as “Chicago” or “post-rock.” Their albums do seem to blur together, with each record subjecting the band’s signature components—John McEntire’s gliding rhythms, Archer Prewitt’s jazz-inflected guitar lines, and analog synth tones warmer than a wool sweater—to slight shifts in texture, personnel or backing instruments. But the overall quality of their discography makes a strong argument against the idea that artists must amass a canon of releases that build upon each other in linear fashion. Like a prescription refill, a new Sea and Cake album offers a fresh dose of the same soothing medicine.`

const styles = {
  title: {
    marginTop: 10,
    marginBottom: 15,
    color: '#444',
    fontWeight: 700,
    // textAlign: 'center',
    fontSize: 18,
  },
  description: {
    fontSize: 16,
    lineHeight: 1.3,
    color: Colors.gray50,
  },
}

const normalizeString = s =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const RATING_REGEX = /^\((1|1\.5|2|2\.5|3|3\.5|4|4\.5|5|5\.5)\)/

const getRelevantPlaylists = playlists =>
  playlists.filter(playlist => {
    return playlist.name.startsWith('_') || /\.\w/.test(playlist.name) || /\?/.test(playlist.name)
  })
const makeExtendedPlaylistObject = playlist => {
  const [_, rating] = playlist.name.match(RATING_REGEX) || [, null]
  return {
    ...playlist,
    name: playlist.name.replace(RATING_REGEX, ''),
    rating: rating ? Number(rating) : undefined,
  }
}

class App extends Component {
  state: {
    accessToken: ?string,
    filter: string,
    detailsView: Object,
  } = {filter: '', detailsView: MOCK ? MOCK_DETAIL : null, open: MOCK}

  componentDidMount() {
    !MOCK && performAuthorizeRedirect.bind(this)()
  }

  async componentDidUpdate(_, prevState) {
    if (!MOCK && !prevState.accessToken && this.state.accessToken) {
      this.api = new Api(this.state.accessToken)
      const me = await this.api.getMe()
      this.setState({me})
    } else if (!prevState.me && this.state.me) {
      const playlists = await this.api.getPlaylists()
      // this.setState({playlists, detailsView: makeExtendedPlaylistObject(playlists[0])})
      this.setState({playlists})
    }
  }

  render() {
    const results =
      this.state.playlists &&
      this.state.playlists.length &&
      _.sortBy(
        getRelevantPlaylists(this.state.playlists).map(makeExtendedPlaylistObject),
        extendedPlaylistObject => 0 - (extendedPlaylistObject.rating || 0)
      ).filter(
        p =>
          !this.state.filter || normalizeString(p.name).includes(normalizeString(this.state.filter))
      )
    if (!this.state.accessToken && !MOCK) {
      return (
        <a
          style={{display: 'none'}}
          id="foo"
          target="_self"
          href={`https://accounts.spotify.com/authorize?client_id=${SPOTIFY_PLAYLISTS_EXTENDED_CLIENT_ID}&scope=playlist-read-private%20playlist-read-collaborative%20playlist-modify-public%20user-read-recently-played%20playlist-modify-private%20ugc-image-upload%20user-follow-modify%20user-follow-read%20user-library-read%20user-library-modify%20user-read-private%20user-read-email%20user-top-read%20user-read-playback-state&response_type=token&redirect_uri=${REDIRECT_URI}`}>
          foo
        </a>
      )
    } else {
      return (
        <div className="App">
          <div style={{marginRight: 30}}>
            <input
              autoFocus
              style={{width: '100%', maxWidth: 400}}
              placeholder="Filter"
              type="text"
              value={this.state.filter}
              onChange={e => this.setState({filter: e.target.value})}
            />
          </div>
          <div style={{marginTop: 20, marginBottom: 5, fontSize: 14, color: '#222', opacity: 0.5}}>
            {results && <span>{`${results.length} result(s)`}</span>}
          </div>
          {results &&
            results.map(extendedPlaylistObject => {
              return (
                <div
                  onClick={() => {
                    this.setState({detailsView: extendedPlaylistObject, open: true})
                  }}
                  key={extendedPlaylistObject.id}
                  style={{
                    borderBottom: '1px solid hsl(195, 12%, 94%)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    paddingTop: 10,
                    paddingBottom: 10,
                  }}>
                  <img
                    style={{width: 80, borderRadius: 0}}
                    src={extendedPlaylistObject.images[0].url}
                  />
                  {/* Rating */}
                  <span
                    style={{
                      display: 'inline-block',
                      letterSpacing: 1.1,
                      width: 100,
                      marginLeft: 10,
                      color: 'rgba(254, 201, 7, 1.000)',
                    }}>
                    {extendedPlaylistObject.rating && '★'.repeat(extendedPlaylistObject.rating)}
                    {extendedPlaylistObject.rating > 0 &&
                    extendedPlaylistObject.rating !== Math.round(extendedPlaylistObject.rating)
                      ? '+'
                      : ''}
                  </span>

                  <a href={extendedPlaylistObject.uri}>{extendedPlaylistObject.name}</a>
                </div>
              )
            })}
          <SwipeableBottomSheet
            style={{backgroundColor: 'red'}}
            bodyStyle={{backgroundColor: 'transparent'}}
            fullScreen
            onChange={open => this.setState({open})}
            onTransitionEnd={() => this.setState({detailsView: null})}
            marginTop={0}
            open={this.state.open}>
            {this.state.detailsView ? (
              <div
                style={{
                  borderTopLeftRadius: BORDER_RADIUS,
                  borderTopRightRadius: BORDER_RADIUS,
                  overflow: 'hidden',
                  backgroundColor: 'white',
                }}>
                <div style={{position: 'relative', margin: 0}}>
                  <img
                    style={{
                      // borderTopLeftRadius: BORDER_RADIUS,
                      // borderTopRightRadius: BORDER_RADIUS,
                      boxShadow: '1px 1px 20px hsl(192, 22%, 95%)',
                      borderRadius: BORDER_RADIUS,
                      width: '100%',
                      height: window.innerWidth,
                      backgroundColor: 'hsl(192, 22%, 95%)',
                    }}
                    src={this.state.detailsView.images[0].url}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <div>
                      <div
                        style={{
                          height: 4,
                          width: 50,
                          backgroundColor: Colors.gray85,
                          borderRadius: 5,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{margin: 20, overflowY: 'auto'}}>
                  <div style={styles.title}>{this.state.detailsView.name}</div>
                  <div style={styles.description}>{REVIEW}</div>
                </div>
              </div>
            ) : (
              <div />
            )}
          </SwipeableBottomSheet>
        </div>
      )
    }
  }
}

export default App
