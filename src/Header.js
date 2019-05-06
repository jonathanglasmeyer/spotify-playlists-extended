import React from 'react'
import classnames from 'classnames'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Switch from '@material-ui/core/Switch'
import {GENRES} from './constants'
import {listStyles} from './styles'
import {crossIcon} from './icons'
import {getCountForGenre} from './utils'
import './Header.css'

const Header = ({
  playlists,
  playlistsSearchResult,
  activeGenre,
  onChangeActiveGenre,
  onChangeFilter,
  filter,
	unratedOnly,
	onChangeUnratedOnly,
	onResetFilter,
}) => {
  return (
    <div>
      {/*
        Genre Pills
      */}
      <div className='Header_genrePillsWrapper'>
        {Object.keys(GENRES).map(genre => {
          return (
            <div
              className={classnames('genrepill', activeGenre === genre && 'genrepill-active')}
              key={genre}
              onClick={() => onChangeActiveGenre(genre)}>
              {GENRES[genre]}{' '}
              <span style={{display: 'inline-block', minWidth: 20}}>
                {`(${getCountForGenre(genre, playlists)})`}
              </span>
            </div>
          )
        })}
      </div>

      {/* Search Input */}

      <div style={{position: 'relative'}}>
        <input
          autoFocus
          style={{width: '100%', borderRadius: 3}}
          className="filter-input"
          placeholder="Filter"
          type="search"
          value={filter}
          onChange={onChangeFilter}
        />
        {filter &&
          filter.length && (
            <div onClick={onResetFilter} className={'input-cross-icon'}>
              {crossIcon}
            </div>
          )}
      </div>
      <div
        style={{
          marginTop: 20,
          marginBottom: 5,
        }}>
        {/* Count of items; filter by unrated */}

        {playlistsSearchResult && (
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span className='Header__resultsHint'>{`${
              !filter && !activeGenre ? playlists.length : playlistsSearchResult.length
						} result${playlistsSearchResult.length > 1 || playlistsSearchResult.length === 0 ? 's' : ''}`}</span>
            <FormControlLabel
							classes={{label: 'Header__unratedOnlyLabel'}}
              style={{marginTop: -20, marginRight: 2, zIndex: 0}}
              control={
                <Switch
                  checked={unratedOnly}
                  onChange={onChangeUnratedOnly}
                />
              }
              label="Unrated only"
            />
          </div>
        )}
      </div>
    </div>
  )
}
export default Header
