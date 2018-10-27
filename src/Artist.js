import React from 'react'
import _ from 'lodash'
import {isMobile} from './styles'
import _uniqBy from 'lodash/uniqBy'
import _findLast from 'lodash/findLast'
import {SimpleRating, Star} from './components'
import {
  getAvgRating,
  makeExtendedPlaylistObject,
  artistImageUrlCacheKey,
} from './utils'
import './Artist.css'

const IMAGE_SIZE = 60
class Artist extends React.Component {
  state: {
    artistImageUrl: ?string,
  } = {
    artistImageUrl: null,
  }

  async componentDidMount() {
    const cachedImageUrl = window.localStorage.getItem(artistImageUrlCacheKey(this.props.name))
    if (cachedImageUrl) {
      this.setState({artistImageUrl: cachedImageUrl})
    } else {
      const {artists} = await this.props.api.getArtist(this.props.name)
      if (artists) {
        const image = _findLast(_.get(artists, 'items[0].images') || [], image => image.width > 100)
        const url = _.get(image, 'url')
        window.localStorage.setItem(artistImageUrlCacheKey(this.props.name), url)
        this.setState({artistImageUrl: url})
      }
    }
  }
  async componentDidUpdate(prevProps) {
		if (!prevProps.isActive && this.props.isActive) {
			console.info('[Artist.js] this.elem: ', this.elem.getBoundingClientRect().top + window.scrollY);
			const elemTop = this.elem.getBoundingClientRect().top + window.scrollY
			window.scrollTo({top: elemTop - 10, behavior: 'instant'})
			this.fetchDescriptions()
		}
	}

	async fetchDescriptions() {
		const fullPlaylists = await Promise.all(this.props.playlists.map(async (p, idx) => {
			const playlistFull = await this.props.api.getPlaylistFull(p.id)
			return makeExtendedPlaylistObject(playlistFull, idx, this.props.playlists)
		}))
		this.props.onUpdateCertainPlaylistsWithDescriptions(fullPlaylists)
	}

  render() {
    const {name, playlists, onSetActiveArtist, isActive, onOpenDetailsView} = this.props
    const pls = _uniqBy(playlists, 'id')
    const avgRating = getAvgRating(pls)
    const hasRecent = pls.some(p => p.age < 0.1)
    const hasARating = _.some(pls, p => p.rating !== undefined)
    return (
      <div>
				<div className="Artist" onClick={onSetActiveArtist} ref={(elem) => this.elem = elem}>
          {this.state.artistImageUrl ? (
            <div style={{position: 'relative'}}>
              <div
                className="Artist__image"
                style={{backgroundImage: `url(${this.state.artistImageUrl})`}}
              />
              {hasRecent && <div className="Artist__recentlyChangedBlob" />}
            </div>
          ) : (
            <div
              className="Artist__image"
              style={{
                borderRadius: '50%',
                width: IMAGE_SIZE,
                height: IMAGE_SIZE,
                backgroundColor: '#eee',
              }}
            />
          )}

          <div className="Artist__text">
            <div>{name}</div>
            <div className="Artist__secondRow">
              {`${pls.length} album${pls.length > 1 ? 's' : ''}${hasARating ? ', ' : ''}`}
              {hasARating && (
                <span>
                  <span style={{marginRight: 2, display: 'inline-block'}}>
                    {Math.round(avgRating * 2) / 2}
                  </span>
                  <Star />
                  <span style={{opacity: 0.3, display: 'inline-block', margin: '0 5px'}}>
                    {'  '}
                  </span>
                </span>
              )}
              {/*

              <div style={{position: 'relative', top: -1, display: 'inline-block', opacity: 0.4}}>
								{_.times(pls.length, _.constant(<div className='album-icon'/>))}
              </div>{' '}
							*/}
            </div>
          </div>
        </div>

        {isActive && (
          <div className="Artist__albums">
            {pls.map((playlist, idx) => {
              return (
                <div
                  onClick={() => {
                    onOpenDetailsView(playlist)
                  }}
                  key={playlist.id}
                  className="Artist__album"
                  style={{
                    display: 'flex',
                    userSelect: 'none',
                    alignItems: 'flex-start',
                    marginLeft: isMobile ? -20 : -10,
                    paddingLeft: isMobile ? 20 : 10,
                    paddingTop: 10,
                    paddingBottom: idx === pls.length - 1 ? 0 : 10,
                  }}>
                  <img
                    alt="album-art"
                    className="Artist__album__image"
                    src={_.get(playlist, 'images[0].url')}
                  />
                  <div className='Artist__album_textWrapper'>
                    <span className="item-title">{playlist.name}</span>
                    {playlist.rating && <SimpleRating rating={playlist.rating} />}
										{playlist.description && <p className='Artist__album__description'>{playlist.description}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
}

export default Artist
