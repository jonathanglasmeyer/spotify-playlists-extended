// ${userId}/playlists/${playlistId}/tracks
import invariant from 'invariant'
const urlJoin = require('url-join')
const throttle = require('throttle-promise');

const PLAYLIST_LIMIT = process.env.NODE_ENV === 'production' ? 50 : 30
export const DONT_FETCH_ALL_PLAYLISTS = false && process.env.NODE_ENV !== 'production'
 export const DONT_FETCH_ALL_ALBUMS = false && process.env.NODE_ENV !== 'production'

const rateLimitedFetch = throttle(fetch, 5, 1000);

const postprocessAlbum = (o) => {
  const album = o.album || o
  const added_at = o.added_at || null
  if (!album) {
    throw new Error(JSON.stringify(o, null, 2))
    return undefined
  }
  const album_ = {...album, added_at, artist: album.artists[0]}
  album_.playlistName = album_.artist.name + ' – ' + album_.name
  return album_
}

class Api {
  userId: ?string
  accessToken: string

  constructor(accessToken) {
    this.accessToken = accessToken
  }

  fetch = async (url, body, methodProp) => {
		const method = methodProp || 'GET'
    try {
      const request = new Request(urlJoin('https://api.spotify.com/v1', url), {
				body,
				method,
        headers: new Headers({
          Authorization: 'Bearer ' + this.accessToken,
        }),
      })
      const res = await rateLimitedFetch(request)
			if (method === 'GET') {
				return await res.json()
			} else {
				return res
			}
    } catch (err) {
      console.error('Error during spotify api call', err)
      throw err
    }
  }

  async getMe() {
    const me = await this.fetch('me')
    this.userId = me.id
    return me
  }

  getArtist = (artistName) => {
    return this.fetch(
			`search?q=${artistName.replace(/ /g, '%20')}&type=artist`
    )
	}

  getPlaylistFull = (id) => {
    return this.fetch(
			`users/${this.userId}/playlists/${id}`
    )
	}

  updatePlaylistDescription = (id, description) => {
    return this.fetch(
			`users/${this.userId}/playlists/${id}`,
			JSON.stringify({description: description || '-'}),
			'PUT'
    )
	}

  updatePlaylistName = (id, name) => {
    return this.fetch(
			`users/${this.userId}/playlists/${id}`,
			JSON.stringify({name}),
			'PUT'
    )
	}

  createPlaylist = (name) => {
    return this.fetch(
			`users/${this.userId}/playlists`,
			JSON.stringify({name}),
			'POST'
    )
	}

  removePlaylist = async (id) => {
    return this.fetch(
      `users/${this.userId}/playlists/${id}/followers`,
      undefined,
			'DELETE'
    )
  }

  addTracksToPlaylist = (playlistId, uris) => {
    return this.fetch(
      `users/${this.userId}/playlists/${playlistId}/tracks`,
			JSON.stringify({uris}),
			'POST'
    )
	}

  getPlaylists = async (offset = 0, updateUi) => {
    invariant(this.userId, 'userId missing')
		const limit = PLAYLIST_LIMIT // for fetching only some playlists to show sth
    const playlistsPagingObject = await this.fetch(
      `users/${this.userId}/playlists?limit=${limit}&offset=${offset}`
    )
		this.playlistTotalCount = playlistsPagingObject.total
		updateUi(offset, this.playlistTotalCount)
		const returnValue = [
      ...playlistsPagingObject.items,
      ...(playlistsPagingObject.next && !DONT_FETCH_ALL_PLAYLISTS ? (await this.getPlaylists(offset + limit, updateUi)) : []),
    ]
		updateUi(this.playlistTotalCount, this.playlistTotalCount)
		return returnValue
  }

	unsubscribeAlbum = (id) => {
    return this.fetch(
			`me/albums`,
			JSON.stringify([id]),
			'DELETE'
    )
	}


  getAlbums = async (offset = 0) => {
    invariant(this.userId, 'userId missing')
		const limit = 50
    const albumsPagingObject = await this.fetch(
      `users/${this.userId}/albums?limit=${limit}&offset=${offset}`
    )
		const returnValue = [
      ...albumsPagingObject.items,
      ...(albumsPagingObject.next && !DONT_FETCH_ALL_ALBUMS ? (await this.getAlbums(offset + limit)) : []),
    ]
    return returnValue.map(postprocessAlbum).filter(a => a)
  }
}
export default Api
