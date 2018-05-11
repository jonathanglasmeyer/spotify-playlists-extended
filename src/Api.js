// ${userId}/playlists/${playlistId}/tracks
import invariant from 'invariant'
const urlJoin = require('url-join')

const PLAYLIST_LIMIT = 50

class Api {
  userId: ?string
  accessToken: string

  constructor(accessToken) {
    this.accessToken = accessToken
  }

  fetch = async url => {
    try {
      const request = new Request(urlJoin('https://api.spotify.com/v1', url), {
        headers: new Headers({
          Authorization: 'Bearer ' + this.accessToken,
        }),
      })
      const res = await fetch(request)
      return await res.json()
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

  getPlaylists = async (offset = 0) => {
    invariant(this.userId, 'userId missing')
    const playlistsPagingObject = await this.fetch(
      `users/${this.userId}/playlists?limit=${PLAYLIST_LIMIT}&offset=${offset}`
    )
		const returnValue = [
      ...playlistsPagingObject.items,
      ...(playlistsPagingObject.next ? (await this.getPlaylists(offset + PLAYLIST_LIMIT)) : []),
    ]
		return returnValue
  }
}
export default Api
