import { useState, useEffect } from 'react'
import { Store } from './Store'
import './App.css'
import Login from './components/Login';

function App() {
  const [url, setUrl] = useState(() => Store.get('url') || '')
  const [token, setToken] = useState(() => Store.get('token') || '')

  useEffect(() => {
    Store.set('url', url)
  }, [url])

  useEffect(() => {
    Store.set('token', token)
  }, [token])

  return (
    <>
      <div>
       <Login />
       <label htmlFor="url-input">URL:</label>
        <input
          id="url-input"
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Enter URL"
        />
      </div>
      <div>
        <label htmlFor="token-input">Token:</label>
        <input
          id="token-input"
          type="text"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Enter Token"
        />
      </div>
    </>
  )
}

export default App
