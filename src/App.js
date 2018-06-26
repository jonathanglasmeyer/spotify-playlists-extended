import React, {Component} from 'react'
import CssBaseline from '@material-ui/core/CssBaseline'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox'
import Switch from '@material-ui/core/Switch'
import classnames from 'classnames'
import Rating from 'react-rating'
import SwipeableBottomSheet from 'react-swipeable-bottom-sheet'
import _ from 'lodash'
import performAuthorizeRedirect from './performAuthorizeRedirect'
import './App.css'
import Api, {DONT_FETCH_ALL_ALBUMS, DONT_FETCH_ALL_PLAYLISTS} from './Api'
import {REVIEW, MOCK_DETAIL} from './mock'
import {folderIcon, chevronDownIcon, deleteIcon, crossIcon} from './icons'
import {listStyles, styles, BORDER_RADIUS, TEXTAREA_HEIGHT, isMobile} from './styles'
import Dropdown, {DropdownTrigger, DropdownContent} from 'react-simple-dropdown'
const SPOTIFY_PLAYLISTS_EXTENDED_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID
const REDIRECT_URI =
  process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_PRODUCTION_URL
    : 'http://localhost:3000'

const MOCK = false

const ENTER = 13
const ESC = 27

const sanitize = s => s.replace(/[?]/g, '')

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

const getDuplicates = async (playlists, api) => {
  let remove = []
  let deletedNames = {}
  for (const playlist of playlists) {
    const playlistsWithThisName = playlists.filter(p => p.name === playlist.name)
    if (playlistsWithThisName.length > 1) {
      const playlistsToRemove = playlistsWithThisName.filter(
        p => p.id !== playlist.id && !p.name.match(/\(\d\)/)
      )
      if (!(playlist.name in deletedNames)) {
        playlistsToRemove.forEach(p => {
          deletedNames[p.name] = true
          remove = [...remove, ...playlistsToRemove]
        })
      }
    }
  }
  return remove
}

const NO_GENRE = '.?'
const GENRES = {
  '.sw': 'Songwriter',
  '.hh': 'Hiphop',
  '.so': 'Soul',
  '.jo': 'Jazz old',
  '.jc': 'Jazz Contemporary',
  '.si': 'Silent',
  '.cl': 'Classical',
  '.el': 'Electronic',
  [NO_GENRE]: 'Uncategorized',
}

const normalizeString = s =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const RATING_REGEX = /^\((1|1\.5|2|2\.5|3|3\.5|4|4\.5|5|5\.5)\)/
const GENRE_REGEX = /(\.[a-z?]+)/

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

const ratingStyle = {
  display: 'inline-block',
  padding: isMobile ? '4px' : undefined,
  color: 'rgba(254, 201, 7, 1)',
  fontSize: isMobile ? 20 : 18,
}

const ratingElement = <span style={ratingStyle}>★ </span>
const placeholderRatingElement = <span style={{...ratingStyle, opacity: 0.4}}>x </span>
const emptyRatingElement = <span style={ratingStyle}>☆</span>

const SimpleRating = ({rating}) => {
  return (
    <div style={listStyles.rating}>
      {_.times(rating).map(i => (
        <span key={i} style={{color: 'rgba(254, 201, 7, 1)'}}>
          ★
        </span>
      ))}
      {_.times(5 - rating).map(i => (
        <span key={i} style={{color: 'rgba(254, 201, 7, .8)'}}>
          ☆
        </span>
      ))}
    </div>
  )
}

const getRelevantPlaylists = playlists =>
  playlists.filter(playlist => {
    return !playlist.name.includes('*') && playlist.name.includes(' – ')
  })

const makeExtendedPlaylistObject = playlist => {
  const [, rating] = playlist.name.match(RATING_REGEX) || [, null] // eslint-disable-line
  const [, genre] = playlist.name.match(GENRE_REGEX) || [, null] // eslint-disable-line
  const foo = {
    ...playlist,
    originalName: playlist.name,
    name: playlist.name
      .replace(RATING_REGEX, '')
      .replace(GENRE_REGEX, '')
      .replace('?', '')
      .trim(),
    // For some reason you can't PUT empty strings at this data, so for cases where we
    // want to reset description, we submit a "-". This looks ugly here, so pretty print it
    // to "" .. dumb stuff.
    description: playlist.description === '-' ? '' : playlist.description,
    rating: rating ? Number(rating) : undefined,
    // including the dot
    genre: genre || NO_GENRE,
  }

  return foo
}

const getCountForGenre = (genre, extendedPlaylists) => {
  if (!extendedPlaylists) return 0
  return extendedPlaylists.filter(extendedPlaylist => extendedPlaylist.genre === genre).length
}

class App extends Component {
  state: {
    accessToken: ?string,
    filter: string,
    detailsView: Object,
    allPlaylistsFetched: boolean,
    importingAlbums: boolean,
    activeGenre: ?string,
  } = {
    filter: '',
    activeGenre: null,
    detailsView: MOCK ? MOCK_DETAIL : null,
    open: MOCK,
    allPlaylistsFetched: false,
  }

  componentDidMount() {
    !MOCK && performAuthorizeRedirect.bind(this)()
    document.addEventListener(
      'keydown',
      e => {
        if (e.keyCode === ESC && this.state.open) {
          this.setState({open: false})
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
            <div>
              {this.state.albumsWithNoMatchingPlaylist &&
                this.state.albumsWithNoMatchingPlaylist.length && (
                  <div className="bottom-overlay">
                    <h4>Unimported albums</h4>
                    <div>
                      {this.state.albumsWithNoMatchingPlaylist.map(album => (
                        <div key={album.id}>{album.playlistName}</div>
                      ))}
                    </div>
                    <div style={{marginTop: 20}}>
                      <button
                        disabled={this.state.importingAlbums}
                        onClick={this._importPlaylistsFromAlbums}>
                        Import
                      </button>
                    </div>
                  </div>
                )}
              <div style={listStyles.genrePills}>
                {Object.keys(GENRES).map(genre => {
                  return (
                    <div
                      className={classnames(
                        'genrepill',
                        this.state.activeGenre === genre && 'genrepill-active'
                      )}
                      key={genre}
                      onClick={() =>
                        this.setState({
                          activeGenre: this.state.activeGenre === genre ? null : genre,
                        })
                      }>
                      {GENRES[genre]}{' '}
                      <span style={{display: 'inline-block', minWidth: 20}}>
                        {`(${getCountForGenre(genre, playlists)})`}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div style={{position: 'relative'}}>
                <input
                  autoFocus
                  style={{width: '100%', borderRadius: 3}}
                  className="filter-input"
                  placeholder="Filter"
                  type="search"
                  value={this.state.filter}
                  onChange={e => this.setState({filter: e.target.value})}
                />
                {this.state.filter &&
                  this.state.filter.length && (
                    <div onClick={this._resetFilter} className={'input-cross-icon'}>
                      {crossIcon}
                    </div>
                  )}
              </div>
            </div>
            <div style={{marginTop: 20, marginBottom: 5}}>
              {playlistsSearchResult && (
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={listStyles.resultsHint}>{`${
                    !this.state.filter ? playlists.length : playlistsSearchResult.length
                  } result(s)`}</span>
                  <FormControlLabel
								style={{marginTop: -20, marginRight: 2}}
                    control={
                      <Switch
                        value={this.state.checkedA}
                        onChange={e => this.setState({unratedOnly: e.target.checked})}
                      />
                    }
                    label="Unrated only"
                  />
                </div>
              )}
            </div>
            {playlistsSearchResult &&
              playlistsSearchResult.map(extendedPlaylist => {
                return (
                  <div
                    onClick={() => {
                      this.setState({detailsView: extendedPlaylist, open: true}, async () => {
                        const playlistFull = await this.api.getPlaylistFull(extendedPlaylist.id)
                        this.setState({detailsView: makeExtendedPlaylistObject(playlistFull)})
                      })
                    }}
                    key={extendedPlaylist.id}
                    className={'item'}
                    style={{
                      display: 'flex',
                      userSelect: 'none',
                      alignItems: 'flex-start',
                      marginLeft: isMobile ? 0 : -10,
                      paddingLeft: isMobile ? 0 : 10,
                      paddingTop: 10,
                      paddingBottom: 10,
                    }}>
                    <img
                      alt="album-art"
                      style={listStyles.image}
                      src={_.get(extendedPlaylist, 'images[0].url')}
                    />
                    <div style={listStyles.itemMainWrapper}>
                      <span className="item-title" style={listStyles.itemTitle}>
                        {extendedPlaylist.name}
                      </span>
                      {extendedPlaylist.rating && <SimpleRating rating={extendedPlaylist.rating} />}
                    </div>
                  </div>
                )
              })}
            <SwipeableBottomSheet
              bodyStyle={{
                backgroundColor: 'transparent',
                maxWidth: 500,
                backgroundColor: isMobile ? 'white' : undefined,
                margin: '0 auto',
                ...(!isMobile ? {maxHeight: undefined} : {}),
              }}
              onChange={open => this.setState({open})}
              topShadow={isMobile}
              swipeableViewsProps={!isMobile ? {animateTransitions: false} : {}}
              onTransitionEnd={() => this.setState({detailsView: null})}
              marginTop={isMobile ? 0 : 40}
              fullScreen
              open={this.state.open}>
              {this.state.detailsView ? (
                <div
                  style={{
                    borderTopLeftRadius: BORDER_RADIUS,
                    position: 'relative',
                    borderTopRightRadius: BORDER_RADIUS,
                    // overflowY: 'auto',
                    // height: isMobile ? '100vh' : undefined,
                    height: isMobile ? '100vh' : undefined,
                    backgroundColor: 'white',
                  }}>
                  <div
                    onClick={() => this.setState({open: false})}
                    onWheel={e => e.preventDefault()}
                    style={{
                      position: 'fixed',
                      top: 0,
                      width: (window.innerWidth - 500) / 2,
                      left: 0,
                      bottom: 0,
                    }}
                  />
                  <div
                    onClick={() => this.setState({open: false})}
                    onWheel={e => e.preventDefault()}
                    style={{
                      position: 'fixed',
                      top: 0,
                      width: (window.innerWidth - 500) / 2,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  <div className="top-nav-wrapper">
                    <div
                      onClick={() => this.setState({open: false})}
                      className="top-nav-bar-button chevron-up-icon">
                      {chevronDownIcon}
                    </div>
                    <div style={{display: 'flex'}}>
                      <div
                        onClick={this._handleDeletePlaylist}
                        className="top-nav-bar-button delete-icon">
                        {deleteIcon}
                      </div>
                      <Dropdown ref={dropdown => (this.dropdown = dropdown)}>
                        <DropdownTrigger>
                          <div className="top-nav-bar-button folder-icon">{folderIcon}</div>
                        </DropdownTrigger>
                        <DropdownContent>
                          {Object.keys(GENRES).map(genre => {
                            return (
                              <div
                                onClick={() => this._handleChangeGenre(genre)}
                                key={genre}
                                className="dropdown-list-item"
                                style={{
                                  fontWeight: genre === this.state.detailsView.genre ? 700 : 400,
                                }}>
                                {GENRES[genre]}
                              </div>
                            )
                          })}
                        </DropdownContent>
                      </Dropdown>
                    </div>
                  </div>
                  <div style={{position: 'relative', margin: 0}}>
                    <img
                      alt="album-art"
                      style={{
                        boxShadow: '1px 1px 20px hsl(192, 22%, 95%)',
                        borderRadius: BORDER_RADIUS,
                        width: '100%',
                        height: isMobile ? window.innerWidth : undefined,
                        backgroundColor: 'hsl(192, 22%, 95%)',
                      }}
                      src={
                        this.state.detailsView.images && this.state.detailsView.images.length
                          ? this.state.detailsView.images[0].url
                          : undefined
                      }
                    />

                    <div style={styles.fabWrapper}>
                      <a
                        className="fab"
                        href={
                          window.innerWidth < 400
                            ? this.state.detailsView.external_urls.spotify
                            : this.state.detailsView.uri
                        }>
                        <svg height="18" viewBox="0 0 22 28" width="14" fill="white">
                          <path
                            d="m440.415 583.554-18.997-12.243c-1.127-.607-2.418-.544-2.418 1.635v24.108c0 1.992 1.385 2.306 2.418 1.635l18.997-12.243c.782-.799.782-2.093 0-2.892"
                            fillRule="evenodd"
                            transform="translate(-419 -571)"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                  <div style={{margin: 16, marginTop: 16, overflowY: 'auto', overflowX: 'hidden'}}>
                    <div style={styles.title}>{this.state.detailsView.name}</div>
                    <div
                      style={{marginBottom: 8, opacity: this.state.detailsView.rating ? 1 : 0.4}}>
                      <Rating
                        onChange={this._handleUpdateRating}
                        initialRating={this.state.detailsView.rating}
                        emptySymbol={emptyRatingElement}
                        placeholderSymbol={placeholderRatingElement}
                        fullSymbol={ratingElement}
                      />
                    </div>
                    {this.state.detailsView.description !== undefined ? (
                      <textarea
                        ref={r => (this.textarea = r)}
                        placeholder="Add a review"
                        rows={5}
                        onKeyDown={e => {
                          if (e.keyCode === ENTER) {
                            e.preventDefault()
                            this._handleSubmitDescription(this.textarea.value)
                            this.textarea.blur()
                          }
                        }}
                        onBlur={e => this._handleSubmitDescription(e.target.value)}
                        defaultValue={
                          this.state.detailsView.description &&
                          this.state.detailsView.description.length
                            ? this.state.detailsView.description
                            : undefined
                        }
                        style={styles.description}
                      />
                    ) : (
                      <div style={{backgroundColor: 'white', height: TEXTAREA_HEIGHT}} />
                    )}
                  </div>
                  <div style={styles.bottomPane} />
                </div>
              ) : (
                <div />
              )}
            </SwipeableBottomSheet>
          </div>
        </MuiThemeProvider>
      )
    }
  }
  _openGenreModal = () => {}

  _handleSubmitDescription = value => {
    this.api.updatePlaylistDescription(this.state.detailsView.id, value)
  }

  _handleChangeGenre = genre => {
    this.dropdown.hide()
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
