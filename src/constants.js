export const NO_GENRE = '.?'
export const GENRES = {
  '.sw': 'Songwriter',
  '.su': 'Summer',
  '.hh': 'Hiphop',
  '.so': 'Soul',
  '.jo': 'Jazz old',
  '.jc': 'Jazz Contemporary',
  '.si': 'Silent',
  '.cl': 'Classical',
  '.el': 'Electronic',
  [NO_GENRE]: 'Uncategorized',
}

export const SPOTIFY_PLAYLISTS_EXTENDED_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID
export const REDIRECT_URI =
  process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_PRODUCTION_URL
    : 'http://localhost:3000'

export const ENTER = 13
export const ESC = 27

