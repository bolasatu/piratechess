import { useState, useEffect } from 'react'
import { Store } from './Store'
import './App.css'

function App() {
  const [url, setUrl] = useState(() => Store.get('url') || '')

  useEffect(() => {
    Store.set('url', url)
  }, [url])

  return (
    <>
      <input
        type="text"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Enter URL"
      />
    </>
  )
}

export default App
