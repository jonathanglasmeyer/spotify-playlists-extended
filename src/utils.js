import _sumBy from 'lodash/sumBy'
import {NO_GENRE} from './constants'

export const getCountForGenre = (genre, extendedPlaylists) => {
  if (!extendedPlaylists) return 0
  return extendedPlaylists.filter(extendedPlaylist => extendedPlaylist.genre === genre).length
}

export const getAvgRating = pls => {
	const overallRating = _sumBy(pls, 'rating')
	return overallRating  && overallRating > 0 ?
  (overallRating / pls.filter(p => p.rating !== undefined).length) : undefined
}

export const getAvgAge = pls =>
  (_sumBy(pls, 'age') || 0) / pls.length

export const sanitize = s => s.replace(/[?]/g, '')

export const playlistCacheKey = id => `playlist-${id}`
export const artistImageUrlCacheKey = id => `artist-image-url-${id}`

const RATING_REGEX = /^\((1|1\.5|2|2\.5|3|3\.5|4|4\.5|5|5\.5)\)/
const GENRE_REGEX = /\s(\.[a-z?]+)/

export const makeExtendedPlaylistObject = (playlist, index, arr) => {
	if (index === undefined) {
		console.info('[utils.js] ', 'Cannot derive "age" without index');
	}
	if (!playlist) return playlist
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
		age: index !== undefined ? index / arr.length : undefined,
		index,
  }

  return foo
}


export const getRelevantPlaylists = playlists =>
  playlists.filter(playlist => {
    return !playlist.name.includes('*') && playlist.name.includes(' – ')
  })
