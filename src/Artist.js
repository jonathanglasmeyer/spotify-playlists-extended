import React from 'react'
import _ from 'lodash'
import {listStyles, isMobile} from './styles'
import _uniqBy from 'lodash/uniqBy'
import _findLast from 'lodash/findLast'
import {SimpleRating, Star} from './components'
import {albumIcon} from './icons'
import {
  getAvgRating,
  playlistCacheKey,
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
    }

    const {artists} = await this.props.api.getArtist(this.props.name)
    if (artists) {
      const image = _findLast(_.get(artists, 'items[0].images') || [], image => image.width > 100)
      const url = _.get(image, 'url')
      window.localStorage.setItem(artistImageUrlCacheKey(this.props.name), url)
      this.setState({artistImageUrl: url})
    }
  }

  render() {
    const {name, playlists, onSetActiveArtist, isActive, onOpenDetailsView} = this.props
    const pls = _uniqBy(playlists, 'id')
    const avgRating = getAvgRating(pls)
    const hasRecent = pls.some(p => p.age < 0.1)
    const hasARating = _.some(pls, p => p.rating !== undefined)
    return (
      <div>
        <div className="Artist" onClick={onSetActiveArtist}>
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
									<Star /><span style={{opacity: .3, display: 'inline-block', margin: '0 5px'}}>{'  '}</span>
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
            {pls.map(playlist => {
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
                    paddingBottom: 10,
                  }}>
                  <img
                    alt="album-art"
                    className="Artist__album__image"
                    src={_.get(playlist, 'images[0].url')}
                  />
                  <div style={listStyles.itemMainWrapper}>
                    <span className="item-title" style={listStyles.itemTitle}>
                      {playlist.name}
                    </span>
                    {playlist.rating && <SimpleRating rating={playlist.rating} />}
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
