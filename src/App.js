import React, {Component} from 'react'
import _ from 'lodash'
import {MuiThemeProvider, createMuiTheme} from '@material-ui/core/styles'
import performAuthorizeRedirect from './performAuthorizeRedirect'
import './App.css'
import Api, {DONT_FETCH_ALL_ALBUMS, DONT_FETCH_ALL_PLAYLISTS} from './Api'
import {MOCK_DETAIL} from './mock'
import UnimportedAlbumsModal from './UnimportedAlbumsModal'
import Header from './Header'
import Artist from './Artist'
import DetailView from './DetailView'
import {NO_GENRE, SPOTIFY_PLAYLISTS_EXTENDED_CLIENT_ID, REDIRECT_URI, ESC} from './constants'
import {
  getAvgRating,
  sanitize,
  playlistCacheKey,
  makeExtendedPlaylistObject,
  getRelevantPlaylists,
} from './utils'

const MOCK = false

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const addPlaylistsForAlbums = async (albums, api, then) => {
  for (const album of albums) {
    const res = await api.createPlaylist(album.playlistName)
    if (res.ok) {
      const pl = await res.json()
      await api.addTracksToPlaylist(pl.id, album.tracks.items.map(t => t.uri))
    }

    await wait(300)
  }
  then()
}

const normalizeString = s =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const materialUITheme = createMuiTheme({
  palette: {
    secondary: {main: '#222'},
  },
  typography: {
    // Use the system font.
    fontFamily:
      '-apple-system,system-ui,BlinkMacSystemFont,' +
      '"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
  },
})

class App extends Component {
  state: {
    accessToken: ?string,
    filter: string,
    detailsView: Object,
    allPlaylistsFetched: boolean,
    importingAlbums: boolean,
    activeGenre: ?string,
    activeArtist: ?string,
    editingDescription: false,
  } = {
    filter: '',
    activeGenre: null,
    detailsView: MOCK ? MOCK_DETAIL : null,
    open: MOCK,
    activeArtist: null,
    allPlaylistsFetched: false,
  }

  componentDidMount() {
    window.onpopstate = e => {
      this.setState({detailsView: null, open: false, editingDescription: false})
    }

    !MOCK && performAuthorizeRedirect.bind(this)()
    document.addEventListener(
      'keydown',
      e => {
        if (e.keyCode === ESC && this.state.open) {
          this.setState({open: false, editingDescription: false})
        }
      },
      false
    )
  }

  async componentDidUpdate(_, prevState) {
    if (!MOCK && !prevState.accessToken && this.state.accessToken) {
      this.api = new Api(this.state.accessToken)
      const me = await this.api.getMe()
      this.setState({me})
    } else if (!prevState.me && this.state.me) {
      const playlists = await this.fetchPlaylists()
      const albums = await this.api.getAlbums()
      this._albums = albums
      const albumsWithNoMatchingPlaylist = albums.filter(
        a => !playlists.some(p => sanitize(p.name).includes(sanitize(a.playlistName)))
      )
      // The check above will be non-correct if we haven't fetched everything (in dev)
      if (!DONT_FETCH_ALL_ALBUMS && !DONT_FETCH_ALL_PLAYLISTS) {
        if (albumsWithNoMatchingPlaylist.length) {
          this.setState({albumsWithNoMatchingPlaylist})
        }
        // don't pass in the extended version here so that we have the original name of the playlist (and have an indicator which ones to keep (those with ratings)
        // const duplicates = await getDuplicates(getRelevantPlaylists(allPlaylists), this.api)
      }
    }
  }

  render() {
    const {playlists, activeGenre} = this.state
    const playlistsSearchResult =
      playlists &&
      playlists.length &&
      _.sortBy(playlists, extendedPlaylist => 0 - (extendedPlaylist.rating || 0)).filter(
        extendedPlaylist => {
          const normalizedFilter = normalizeString(this.state.filter).trim()
          return (
            (this.state.unratedOnly ? !extendedPlaylist.rating : true) &&
            (!this.state.filter ||
              normalizeString(extendedPlaylist.name).includes(normalizedFilter)) &&
            (extendedPlaylist.genre && activeGenre ? extendedPlaylist.genre === activeGenre : true)
          )
        }
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
      // This will be not visible as the playlists then load very fast from localStorage
      if (!playlists && !MOCK) return <div />
      return (
        <MuiThemeProvider theme={materialUITheme}>
          <div className="App">
						<div style={{position: 'fixed', top: 0, right: 0, fontSize: 10}}>v1</div>
            <div>
              {this.state.albumsWithNoMatchingPlaylist &&
                this.state.albumsWithNoMatchingPlaylist.length && (
                  <UnimportedAlbumsModal
                    albums={this.state.albumsWithNoMatchingPlaylist}
                    isImporting={this.state.importingAlbums}
                    onClickImport={this._importPlaylistsFromAlbums}
                  />
                )}
              <Header
                playlists={playlists}
                playlistsSearchResult={playlistsSearchResult}
                filter={this.state.filter}
                onChangeFilter={e => this.setState({filter: e.target.value})}
                onChangeUnratedOnly={e => this.setState({unratedOnly: e.target.checked})}
                onResetFilter={this._resetFilter}
                activeGenre={this.state.activeGenre}
                onChangeActiveGenre={genre =>
                  this.setState({
                    activeGenre: this.state.activeGenre === genre ? null : genre,
                  })
                }
              />
            </div>
            {playlistsSearchResult &&
              _.sortBy(
                _.entries(_.groupBy(playlistsSearchResult, p => p.name.split(' – ')[0])),
                ([name, playlists]) => {
                  const pls = playlists
                  const hasRecent = pls.some(p => p.age < 0.1)

                  const howRecent = _.min(pls.map(p => p.age)) / 0.1
                  const factor =
                    getAvgRating(pls) + pls.length / 3 + (hasRecent ? 10 / howRecent : 0)
                  return 1 / factor
                }
              ).map(([name, playlists]) => {
                return (
                  <Artist
										key={name}
										api={this.api}
                    name={name}
                    playlists={playlists}
                    onOpenDetailsView={playlist => {
                      window.history.pushState(null, null, '#details') // push state that hash into the url
                      this.setState({detailsView: playlist, open: true}, async () => {
                        const cacheKey = playlistCacheKey(playlist.id)
                        const cachedPlaylist = JSON.parse(
                          window.localStorage.getItem(cacheKey) || 'null'
                        )
                        if (cachedPlaylist) {
                          this.setState({detailsView: cachedPlaylist})
                        }
                        const playlistFull = await this.api.getPlaylistFull(playlist.id)
                        const extendedPlaylistFull = makeExtendedPlaylistObject(playlistFull)
                        window.localStorage.setItem(cacheKey, JSON.stringify(extendedPlaylistFull))
                        this.setState({detailsView: extendedPlaylistFull})
                      })
                    }}
                    isActive={this.state.activeArtist === name}
                    onSetActiveArtist={() =>
                      this.setState({
                        activeArtist: this.state.activeArtist === name ? null : name,
                      })
                    }
                  />
                )
              })}
            <DetailView
              open={this.state.open}
              onChangeOpen={open => this.setState({open})}
              onSubmitDescription={this._handleSubmitDescription}
              detailsView={this.state.detailsView}
              onUnsetDetailsView={() => this.setState({detailsView: null})}
              onUpdateRating={this._handleUpdateRating}
              onDeletePlaylist={this._handleDeletePlaylist}
              onChangeGenre={this._handleChangeGenre}
            />
          </div>
        </MuiThemeProvider>
      )
    }
  }
  _openGenreModal = () => {}

  _handleSubmitDescription = value => {
    this.api.updatePlaylistDescription(this.state.detailsView.id, value)
    const newItem = {...this.state.detailsView, description: value}
    window.localStorage.setItem(
      playlistCacheKey(this.state.detailsView.id),
      JSON.stringify(newItem)
    )
  }

  _handleChangeGenre = genre => {
    const {detailsView: extendedPlaylist} = this.state
    const genreFormatted = genre === NO_GENRE ? '' : genre
    const ratingFormatted = extendedPlaylist.rating ? `(${extendedPlaylist.rating})` : ''
    const playlistName = `${ratingFormatted} ${extendedPlaylist.name} ${genreFormatted}`

    this.api.updatePlaylistName(extendedPlaylist.id, playlistName)
    this.setState(({playlists}) => ({
      detailsView: {...extendedPlaylist, genre: genreFormatted.length ? genreFormatted : undefined},
      playlists: playlists.map(
        p =>
          p.id === extendedPlaylist.id
            ? {...p, originalName: playlistName, genre: genreFormatted}
            : p
      ),
    }))
  }

  _handleUpdateRating = rating => {
    const {detailsView: extendedPlaylist} = this.state
    const playlistName = `(${rating}) ${extendedPlaylist.name} ${extendedPlaylist.genre}`

    this.api.updatePlaylistName(extendedPlaylist.id, playlistName)
    this.setState(({playlists}) => ({
      detailsView: {...extendedPlaylist, rating},
      playlists: playlists.map(
        p => (p.id === extendedPlaylist.id ? {...p, originalName: playlistName, rating} : p)
      ),
    }))
  }

  _handleDeletePlaylist = async () => {
    const {detailsView: extendedPlaylist} = this.state

    const relatedAlbum = this._albums.find(a => a.playlistName === extendedPlaylist.name)
    if (window.confirm(`Delete playlist ${extendedPlaylist.name}?`)) {
      await this.api.removePlaylist(extendedPlaylist.id)
      if (relatedAlbum) {
        await this.api.unsubscribeAlbum(relatedAlbum.id)
      }
      this.setState(({playlists}) => ({
        playlists: playlists.filter(p => p.id !== extendedPlaylist.id),
        editingDescription: false,
        open: false,
      }))
    }
  }

  _resetFilter = () => {
    this.setState({filter: ''})
  }

  fetchPlaylists = async () => {
    const cachedPlaylists = JSON.parse(window.localStorage.getItem('playlists') || 'null')
    this.setState({playlists: cachedPlaylists})
    const allPlaylists = await this.api.getPlaylists()
    const allPlaylistsExtended = getRelevantPlaylists(allPlaylists).map(makeExtendedPlaylistObject)
    window.localStorage.setItem('playlists', JSON.stringify(allPlaylistsExtended))
    this.setState({playlists: allPlaylistsExtended})
    return allPlaylistsExtended
  }

  _importPlaylistsFromAlbums = async () => {
    this.setState({importingAlbums: true})
    addPlaylistsForAlbums(this.state.albumsWithNoMatchingPlaylist, this.api, async () => {
      await this.fetchPlaylists()
      this.setState({importingAlbums: false})
      this.setState({albumsWithNoMatchingPlaylist: null})
    })
  }
}

export default App
