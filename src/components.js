import React from 'react'
import _ from 'lodash'

export const SimpleRating = ({rating}) => {
  return (
    <div className='SimpleRating'>
      {_.times(rating).map(i => (
        <span key={i} style={{color: 'rgba(254, 201, 7, 1)'}}>
          ★
        </span>
      ))}
      {_.times(5 - rating).map(i => (
        <span key={i} style={{color: 'rgba(254, 201, 7, .8)'}}>
          ☆
        </span>
      ))}
    </div>
  )
}
export const Star = () =>
        <span style={{color: 'rgba(254, 201, 7, 1)'}}>
          ★
        </span>
