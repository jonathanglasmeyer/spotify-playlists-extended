import React from 'react'
import Rating from 'react-rating'
import _ from 'lodash'
import SwipeableBottomSheet from 'react-swipeable-bottom-sheet'
import {styles, isMobile, BORDER_RADIUS, TEXTAREA_HEIGHT} from './styles'
import {folderIcon, chevronDownIcon, deleteIcon} from './icons'
import {GENRES, ENTER, ESC} from './constants'
import Dropdown, {DropdownTrigger, DropdownContent} from 'react-simple-dropdown'

const ratingStyle = {
  display: 'inline-block',
  padding: isMobile ? '4px' : undefined,
  color: 'rgba(254, 201, 7, 1)',
  fontSize: isMobile ? 20 : 18,
}

const ratingElement = <span style={ratingStyle}>★ </span>
const placeholderRatingElement = <span style={{...ratingStyle, opacity: 0.4}}>x </span>
const emptyRatingElement = <span style={ratingStyle}>☆</span>

const EDITING_OPACITY = 0.15

class DetailView extends React.Component {
  state: {
    editingDescription: boolean,
  } = {
    editingDescription: false,
  }

  render() {
    const {open, onChangeOpen, onChangeGenre, onDeletePlaylist, onUnsetDetailsView, onSubmitDescription, onUpdateRating, detailsView} = this.props
    const opacityDuringDescrEditing =
      this.state.editingDescription && isMobile ? EDITING_OPACITY : 1
    const onClose = () => {
      onChangeOpen(false)
      this.setState({editingDescription: false})
    }

    return (
      <SwipeableBottomSheet
        bodyStyle={{
          maxWidth: 500,
          backgroundColor: isMobile ? 'white' : undefined,
          margin: '0 auto',
          ...(!isMobile ? {maxHeight: undefined} : {}),
        }}
        onChange={open => onChangeOpen(open)}
        topShadow={isMobile}
        swipeableViewsProps={{animateTransitions: false}}
        onTransitionEnd={onUnsetDetailsView}
        marginTop={isMobile ? 0 : 40}
        fullScreen
        open={open}>
        {detailsView ? (
          <div
            style={{
              borderTopLeftRadius: BORDER_RADIUS,
              position: 'relative',
              borderTopRightRadius: BORDER_RADIUS,
              height: isMobile ? '100vh' : undefined,
              backgroundColor: 'white',
            }}>
            <div
              onClick={onClose}
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
              onClick={onClose}
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
                style={{
                  opacity: opacityDuringDescrEditing,
                }}
                onClick={onClose}
                className="top-nav-bar-button chevron-up-icon">
                {chevronDownIcon}
              </div>
              <div
                style={{
                  display: 'flex',
                  opacity: opacityDuringDescrEditing,
                }}>
                <div
                  onClick={onDeletePlaylist}
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
                          onClick={onChangeGenre(genre)}
                          key={genre}
                          className="dropdown-list-item"
                          style={{
                            fontWeight: genre === detailsView.genre ? 700 : 400,
                          }}>
                          {GENRES[genre]}
                        </div>
                      )
                    })}
                  </DropdownContent>
                </Dropdown>
              </div>
            </div>
            <div
              className="album-art-full-wrapper"
              style={{
                ...(this.state.editingDescription && isMobile
                  ? {height: 40, margin: 10, opacity: 0}
                  : {height: 180}),
                ...(!isMobile ? {marginTop: 65, paddingTop: 80, marginBottom: 130} : {}),
              }}>
              <a
                style={this.state.editingDescription ? {pointerEvents: 'none'} : undefined}
                href={
                  this.state.editingDescription
                    ? undefined
                    : window.innerWidth < 400
                      ? _.get(detailsView, 'external_urls.spotify')
                      : _.get(detailsView, 'uri')
                }>
                <img
                  alt="album-art"
                  key={_.get(detailsView, 'id')}
                  className="album-art-full"
                  src={
                    detailsView.images && detailsView.images.length
                      ? detailsView.images[0].url
                      : undefined
                  }
                />
              </a>
            </div>
            <div
              style={{
                margin: 16,
                marginTop: 16,
                overflowY: 'auto',
                overflowX: 'hidden',
              }}>
              <div
                style={{
                  ...styles.title,
                  opacity: opacityDuringDescrEditing,
                }}>
                {detailsView.name}
              </div>
              <div
                style={{
                  marginBottom: 8,
                  marginTop: 8,
                  // opacity: detailsView.rating ? 1 : 0.4,
                  opacity: opacityDuringDescrEditing,
                }}>
                <Rating
                  onChange={onUpdateRating}
                  initialRating={detailsView.rating}
                  emptySymbol={emptyRatingElement}
                  placeholderSymbol={placeholderRatingElement}
                  fullSymbol={ratingElement}
                />
              </div>
              {detailsView.description !== undefined ? (
                <textarea
                  ref={r => (this.textarea = r)}
                  placeholder="Add a review"
                  rows={5}
                  onFocus={() => this.setState({editingDescription: true})}
                  onKeyDown={e => {
                    if (e.keyCode === ENTER || e.keyCode === ESC) {
                      e.preventDefault()
                      onSubmitDescription(this.textarea.value)
                      this.textarea.blur()
                    }
                  }}
                  onBlur={e => {
                    onSubmitDescription(e.target.value)
                    this.setState({editingDescription: false})
                  }}
                  defaultValue={
                    detailsView.description && detailsView.description.length
                      ? detailsView.description
                      : undefined
                  }
                  style={{
                    ...styles.description,
                    color: this.state.editingDescription ? '#000' : undefined,
                  }}
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
    )
  }
}

export default DetailView
