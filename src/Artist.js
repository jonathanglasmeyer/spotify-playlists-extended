import React from 'react'
import _ from 'lodash'
import {listStyles, isMobile} from './styles'
import _uniqBy from 'lodash/uniqBy'
import {SimpleRating} from './components'
import {getAvgRating, playlistCacheKey, makeExtendedPlaylistObject} from './utils'

const Artist = ({name, playlists, onSetActiveArtist, isActive, onOpenDetailsView}) => {
  const pls = _uniqBy(playlists, 'id')
  const avgRating = getAvgRating(pls)
  const hasRecent = pls.some(p => p.age < 0.1)
  return (
    <div>
      <h4
        style={{cursor: 'pointer', fontWeight: 400}}
        onClick={onSetActiveArtist
        }>
        {hasRecent && (
          <span
            style={{
              display: 'inline-block',
              marginRight: 5,
              opacity: 0.8,
              position: 'relative',
              top: -2,
              backgroundColor: '#888',
              width: 7,
              height: 7,
              borderRadius: '50%',
            }}
          />
        )}
        {`${name} (${pls.length} album${pls.length > 1 ? 's' : ''})`}
        {_.some(pls, p => p.rating !== undefined) && (
          <SimpleRating rating={Math.round(avgRating)} />
        )}
      </h4>
      {isActive &&
        pls.map(playlist => {
          return (
            <div
              onClick={() => {
								onOpenDetailsView(playlist)
              }}
              key={playlist.id}
              className={'item'}
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
                style={listStyles.image}
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
  )
}

export default Artist
