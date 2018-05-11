import React, {Component} from 'react'
import performAuthorizeRedirect from './performAuthorizeRedirect'
import './App.css'
import Api from './Api'

class App extends Component {
  state: {
    accessToken: ?string,
  } = {}

  componentDidMount() {
    performAuthorizeRedirect.bind(this)()
  }

  async componentDidUpdate(_, prevState) {
    if (!prevState.accessToken && this.state.accessToken) {
      this.api = new Api(this.state.accessToken)
      const me = await this.api.getMe()
      this.setState({me})
    } else if (!prevState.me && this.state.me) {
      const playlists = await this.api.getPlaylists()
      this.setState({playlists})
    }
  }

  render() {
    return (
      <div className="App">
        {this.state.playlists &&
          this.state.playlists.length &&
          this.state.playlists.map(playlist => {
            return <div key={playlist.id}>{playlist.name}</div>
          })}
      </div>
    )
  }
}

export default App
