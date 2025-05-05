import {useState, useEffect} from 'react'
import {Store} from './Store'
import './App.css'
import Login from './components/Login';
import {AuthUtils} from './AuthUtils';
import {getChapters} from './chapterUtils';
import {getCourse} from './courseUtils';

function App() {
    const [url, setUrl] = useState(() => Store.get('url') || '')
    const [token, setToken] = useState(() => Store.get('token') || '')
    const [chapters, setChapters] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [downloadingChapter, setDownloadingChapter] = useState<string | null>(null)
    const [chapterStatus, setChapterStatus] = useState('')
    const [lineStatus, setLineStatus] = useState('')
    const isLoggedIn = AuthUtils.isLoggedIn()

    useEffect(() => {
        Store.set('url', url)
    }, [url])

    useEffect(() => {
        Store.set('token', token)
    }, [token])
    const handleGetChapters = async () => {
        if (!isLoggedIn) {
            setError('Please log in first')
            return
        }

        setLoading(true)
        setError('')

        try {
            const uid = AuthUtils.getUserId()
            if (!uid) {
                throw new Error('User ID not found')
            }

            const chaptersData = await getChapters(uid)
            setChapters(chaptersData)
        } catch (err: any) {
            setError(`Error fetching chapters: ${err.message || 'Unknown error'}`)
            console.error('Failed to fetch chapters:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleGetCourse = async (bid: string, name: string) => {
        if (!isLoggedIn) {
            setError('Please log in first')
            return
        }

        setError('')
        setDownloadingChapter(bid)
        setChapterStatus('')
        setLineStatus('')

        try {
            // Use 10000 as max lines (default) and pass our status callbacks
            const [pgn, courseName] = await getCourse(
                bid,
                10000,
                (message) => setChapterStatus(message),
                (message) => setLineStatus(message)
            )

            if (pgn && courseName) {
                // You could save the PGN here or display it
                console.log(`Downloaded course: ${courseName}`)
                // Example: save to localStorage
                localStorage.setItem(`course_${bid}`, pgn)
            } else {
                setError(`Failed to download ${name}`)
            }
        } catch (err: any) {
            setError(`Error downloading course: ${err.message || 'Unknown error'}`)
            console.error('Failed to download course:', err)
        } finally {
            setDownloadingChapter(null)
        }
    }
    return (
        <>
            <div>
                <Login/>
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

            {/* Chapters section */}
            <div style={{marginTop: '20px'}}>
                <h2>Courses</h2>
                <button
                    onClick={handleGetChapters}
                    disabled={!isLoggedIn || loading}
                >
                    {loading ? 'Loading...' : 'Get Courses'}
                </button>

                {error && <p style={{color: 'red'}}>{error}</p>}

                {Object.keys(chapters).length > 0 && (
                    <div style={{marginTop: '10px'}}>
                        <h3>Available Courses:</h3>
                        <ul>
                            {Object.entries(chapters).map(([bid, name]) => (
                                <li key={bid}>
                                    {name} (ID: {bid})
                                    <button
                                        onClick={() => handleGetCourse(bid, name)}
                                        disabled={downloadingChapter !== null}
                                        style={{marginLeft: '10px'}}
                                    >
                                        Download Course
                                    </button>
                                    {downloadingChapter === bid && (
                                        <div style={{marginTop: '5px'}}>
                                            <p>Downloading: Chapter {chapterStatus || '...'},
                                                Line {lineStatus || '...'}</p>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </>
    )
}

export default App
