import React, {useState} from 'react';
import {getCourse, getCourseChapters, Chapter, getChapter} from "../courseUtils.ts";


interface CourseListProps {
    courses: Record<string, string>;
}

const CourseList: React.FC<CourseListProps> = ({courses}) => {
    const [chapters, setChapters] = useState<Record<string, Chapter[]>>({});
    const [loadingChapters, setLoadingChapters] = useState<string | null>(null);
    const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
    const [courseStatus, setCourseStatus] = useState('');
    const [lineStatus, setLineStatus] = useState('');
    const [downloadingCourse, setDownloadingCourse] = useState<string | null>(null);

    // Function to fetch and load chapters for a course
    const handleGetCourse = async (bid: string) => {
        setDownloadingCourse(bid);
        setCourseStatus('');
        setLineStatus('');
        await getCourse(bid)
        try {
            // Simulate download progress
            setCourseStatus('Starting download');
            setLineStatus('Initializing...');
            await new Promise(res => setTimeout(res, 1000));

            setCourseStatus('Downloading');
            setLineStatus('50% complete');
            await new Promise(res => setTimeout(res, 1000));

            setCourseStatus('Finishing');
            setLineStatus('Almost done');
            await new Promise(res => setTimeout(res, 1000));

            setCourseStatus('Done');
            setLineStatus('');
        } catch (err) {
            setCourseStatus('Error');
            setLineStatus('');
        } finally {
            setTimeout(() => {
                setDownloadingCourse(null);
            }, 1000);
        }
    };

    // Function to fetch chapters for a specific course
    const toggleChapters = async (bid: string, _name: string) => {
        // Toggle chapter visibility if already loaded
        if (chapters[bid] && chapters[bid].length > 0) {
            setExpandedCourses(prev => ({
                ...prev,
                [bid]: !prev[bid]
            }));
            return;
        }

        setLoadingChapters(bid);
        try {
            const courseChapters = await getCourseChapters(bid)

            setChapters(prev => ({
                ...prev,
                [bid]: courseChapters
            }));

            // Auto-expand after loading
            setExpandedCourses(prev => ({
                ...prev,
                [bid]: true
            }));
        } catch (err) {
            console.error('Error fetching chapters:', err);
        } finally {
            setLoadingChapters(null);
        }
    };

    const handleGetChapter = async (bid: string, chapterId: number) => {
        await getChapter(bid,chapterId)

    }
    if (Object.keys(courses).length === 0) return null;

    return (
        <div style={{marginTop: '10px'}}>
            <h3>Available Courses:</h3>
            <ul>
                {Object.entries(courses).map(([bid, name]) => (
                    <li key={bid}>
                        {name}
                        <button
                            onClick={() => handleGetCourse(bid)}
                            disabled={downloadingCourse !== null}
                            style={{marginLeft: '10px'}}
                        >
                            Download Course
                        </button>

                        <button
                            onClick={() => toggleChapters(bid, name)}
                            disabled={loadingChapters !== null}
                            style={{marginLeft: '10px'}}
                        >
                            {chapters[bid] && chapters[bid].length > 0
                                ? (expandedCourses[bid] ? 'Hide Chapters' : 'Show Chapters') : 'Load Chapters'}
                        </button>


                        {downloadingCourse === bid && (
                            <div style={{marginTop: '5px'}}>
                                <p>Downloading: Course {courseStatus || '...'},
                                    Line {lineStatus || '...'}</p>
                            </div>)}

                        {/* Loading indicator for chapters */}
                        {loadingChapters === bid && (
                            <div style={{marginTop: '5px'}}>
                                <p>Loading chapters...</p>
                            </div>
                        )}

                        {/* Display chapters if they exist for this course and are expanded */}
                        {chapters[bid] && chapters[bid].length > 0 && expandedCourses[bid] && (
                            <div style={{marginLeft: '20px', marginTop: '10px'}}>
                                <h4>Chapters:</h4>
                                <ul>
                                    {chapters[bid].map((chapter) => (
                                        <li key={chapter.id}>
                                            {chapter.title}
                                            <button
                                                onClick={() => handleGetChapter(bid, chapter.id)}
                                                style={{marginLeft: '10px'}}
                                            >
                                                Download
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CourseList;
