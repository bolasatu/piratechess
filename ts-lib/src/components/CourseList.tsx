import React, { useState } from 'react';

interface CourseListProps {
    courses: Record<string, string>;
}

const CourseList: React.FC<CourseListProps> = ({ courses }) => {
    const [downloadingCourse, setDownloadingCourse] = useState<string | null>(null);
    const [courseStatus, setCourseStatus] = useState('');
    const [lineStatus, setLineStatus] = useState('');

    // Dummy async download function for demonstration
    const handleGetCourse = async (bid: string, _name: string) => {
        setDownloadingCourse(bid);
        setCourseStatus('');
        setLineStatus('');
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
            setTimeout(() => setDownloadingCourse(null), 1000);
        }
    };

    if (Object.keys(courses).length === 0) return null;
    return (
        <div style={{ marginTop: '10px' }}>
            <h3>Available Courses:</h3>
            <ul>
                {Object.entries(courses).map(([bid, name]) => (
                    <li key={bid}>
                        {name} 
                        <button
                            onClick={() => handleGetCourse(bid, name)}
                            disabled={downloadingCourse !== null}
                            style={{ marginLeft: '10px' }}
                        >
                            Download Course
                        </button>
                        {downloadingCourse === bid && (
                            <div style={{ marginTop: '5px' }}>
                                <p>Downloading: Course {courseStatus || '...'},
                                    Line {lineStatus || '...'}</p>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CourseList;
