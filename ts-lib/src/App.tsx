import {useState, useEffect} from 'react'
import {Store} from './Store'
import './App.css'
import Login from './components/Login';
import CourseList from './components/CourseList';
import {AuthUtils} from './AuthUtils';
import {getChapters} from './chapterUtils';

function App() {
    const [courses, setCourses] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const isLoggedIn = AuthUtils.isLoggedIn()

    
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
