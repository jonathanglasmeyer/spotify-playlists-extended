import React from 'react'

export default function UnimportedAlbumsModal({albums, onClickImport}) {
  return (
    <div className="bottom-overlay">
      <h4>Unimported albums</h4>
      <div>
        {albums.map(album => (
          <div key={album.id}>{album.playlistName}</div>
        ))}
      </div>
      <div style={{marginTop: 20}}>
        <button onClick={onClickImport}>Import</button>
      </div>
    </div>
  )
}
