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

const EDITING_OPACITY = 0.08

class DetailView extends React.Component {

	// componentDidUpdate(prevProps) {
	// 	if (prevProps.open && !this.props.open) {
	// 	}
	// }
	componentDidMount() {
    window.onpopstate = e => {
			console.info('[DetailView.js] ', 'foo');
			this.props.onSubmitDescription(this.textarea.value)
			this.props.onChangeOpen(false)
      // this.setState({detailsView: null, open: false, editingDescription: false})
    }
	}

  render() {
    const {
      open,
      onChangeOpen,
      onChangeGenre,
      onDeletePlaylist,
      onUnsetDetailsView,
      onSubmitDescription,
			onEditDescription,
      onUpdateRating,
			editingDescription,
      detailsView,
    } = this.props
    const opacityDuringDescrEditing =
      editingDescription && isMobile ? EDITING_OPACITY : 1

    const onClose = () => {
      onChangeOpen(false)
    }

    return (
      <React.Fragment>
        <SwipeableBottomSheet
          bodyStyle={{
            maxWidth: 500,
            height: isMobile ? undefined : 800,
            backgroundColor: isMobile ? 'white' : undefined,
            overflow: 'hidden',
            margin: '0 auto',
            ...(!isMobile ? {maxHeight: 900} : {}),
          }}
          onChange={open => onChangeOpen(open)}
          topShadow={isMobile}
          swipeableViewsProps={{animateTransitions: false}}
          onTransitionEnd={onUnsetDetailsView}
          marginTop={isMobile ? 0 : 40}
          fullScreen
          open={open}>
          {detailsView ? (
            <React.Fragment>
              {open && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                  }}
                  onClick={onClose}
                />
              )}
              <div
                style={{
                  borderRadius: isMobile ? 0 : 3,
                  position: 'relative',
                  // zIndex: 2,
                  height: isMobile ? '100vh' : undefined,
                  backgroundColor: 'white',
                }}>
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
                    <div onClick={onDeletePlaylist} className="top-nav-bar-button delete-icon">
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
                              onClick={() => {
                                this.dropdown.hide()
                                onChangeGenre(genre)
                              }}
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
                    ...(editingDescription && isMobile
                      ? {height: 40, margin: 10, opacity: 0}
                      : {height: 180}),
                    ...(!isMobile ? {marginTop: 65, paddingTop: 80, marginBottom: 130} : {}),
                  }}>
                  <a
                    style={editingDescription ? {pointerEvents: 'none'} : undefined}
                    href={
                      editingDescription
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
                    margin: isMobile ? 16 : 50,
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
                  <textarea
                    ref={r => (this.textarea = r)}
                    key={_.get(detailsView, 'id')}
                    placeholder="Add a review"
                    rows={5}
                    onFocus={() => onEditDescription(true)}
                    onKeyDown={e => {
                      if (e.keyCode === ENTER || e.keyCode === ESC) {
                        e.preventDefault()
                        onSubmitDescription(this.textarea.value)
                        this.textarea.blur()
                      }
                    }}
                    onBlur={e => {
                      onSubmitDescription(e.target.value)
											onEditDescription(false)
                    }}
                    defaultValue={
                      detailsView.description && detailsView.description.length
                        ? detailsView.description
                        : undefined
                    }
                    style={{
                      ...styles.description,
                    }}
                  />
                </div>
                <div style={styles.bottomPane} />
              </div>
            </React.Fragment>
          ) : (
            <div />
          )}
        </SwipeableBottomSheet>
      </React.Fragment>
    )
  }
}

export default DetailView
