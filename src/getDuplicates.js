const getDuplicates = async (playlists, api) => {
  let remove = []
  let deletedNames = {}
  for (const playlist of playlists) {
    const playlistsWithThisName = playlists.filter(p => p.name === playlist.name)
    if (playlistsWithThisName.length > 1) {
      const playlistsToRemove = playlistsWithThisName.filter(
        p => p.id !== playlist.id && !p.name.match(/\(\d\)/)
      )
      if (!(playlist.name in deletedNames)) {
        playlistsToRemove.forEach(p => {
          deletedNames[p.name] = true
          remove = [...remove, ...playlistsToRemove]
        })
      }
    }
  }
  return remove
}
export default getDuplicates
