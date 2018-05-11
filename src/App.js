import React, {Component} from 'react'
import _ from 'lodash'
import performAuthorizeRedirect from './performAuthorizeRedirect'
import './App.css'
import Api from './Api'

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
  } = {filter: ''}

  componentDidMount() {
    performAuthorizeRedirect.bind(this)()
  }

  async componentDidUpdate(_, prevState) {
    if (!prevState.accessToken && this.state.accessToken) {
      this.api = new Api(this.state.accessToken)
      const me = await this.api.getMe()
      this.setState({me})
    } else if (!prevState.me && this.state.me) {
      const playlists = await this.api.getPlaylists()
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
    return (
      <div className="App">
        <input
					autoFocus
					placeholder='Search'
          type="text"
          value={this.state.filter}
          onChange={e => console.log(e) || this.setState({filter: e.target.value})}
        />
        <div style={{marginTop: 20, marginBottom: 5, fontSize: 14, color: '#222', opacity: 0.5}}>
          {results && <span>{`${results.length} result(s)`}</span>}
        </div>
        {results &&
          results.map(extendedPlaylistObject => {
            console.info('[App.js] extendedPlaylistObject: ', extendedPlaylistObject)
            return (
              <div
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
      </div>
    )
  }
}

export default App
