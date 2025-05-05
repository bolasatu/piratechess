import {useState, useEffect} from 'react'
import {Store} from './Store'
import './App.css'
import Login from './components/Login';
import CourseList from './components/CourseList';
import {AuthUtils} from './AuthUtils';
import {getChapters} from './chapterUtils';

function App() {
    const [url, setUrl] = useState(() => Store.get('url') || '')
    const [token, setToken] = useState(() => Store.get('token') || '')
    const [courses, setCourses] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const isLoggedIn = AuthUtils.isLoggedIn()

    useEffect(() => {
        Store.set('url', url)
    }, [url])

    useEffect(() => {
        Store.set('token', token)
    }, [token])
    
    const handleGetCourses = async () => {
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

            const coursesData = await getChapters(uid)
            setCourses(coursesData)
        } catch (err: any) {
            setError(`Error fetching courses: ${err.message || 'Unknown error'}`)
            console.error('Failed to fetch courses:', err)
        } finally {
            setLoading(false)
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

            {/* Courses section */}
            <div style={{marginTop: '20px'}}>
                <h2>Courses</h2>
                <button
                    onClick={handleGetCourses}
                    disabled={!isLoggedIn || loading}
                >
                    {loading ? 'Loading...' : 'Get Courses'}
                </button>

                {error && <p style={{color: 'red'}}>{error}</p>}

                <CourseList courses={courses} />
            </div>
        </>
    )
}

export default App
