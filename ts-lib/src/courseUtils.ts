import {Method} from 'axios';
import {makeRequest} from './requestUtils';
import {AuthUtils} from "./AuthUtils.ts";
import {downloadChapter} from './chapterUtils';

// Model interfaces
interface ResponseCourse {
    course: Course;
}

interface Course {
    data: Chapter[];
}

export interface Chapter {
    id: number;
    title:string;
}

// Event callback types
type ChapterCounterCallback = (message: string) => void;
type LineCounterCallback = (message: string) => void;

export async function getCourseChapters(
    bid: string,
) :Promise<Chapter[]>{
    const uid = AuthUtils.getUserId()
    debugger
    if (!uid) {
        throw new Error('User ID is missing. Please log in first.');
    }
    const url = `https://www.chessable.com/api/v1/getCourse?uid=${encodeURIComponent(uid)}&bid=${encodeURIComponent(bid)}`;

    try {
        // Fetch course data
        const courseData = await makeRequest(url, 'GET' as Method) as ResponseCourse;

        if (courseData?.course?.data) {
            return courseData.course.data
        }        // Process each chapter
        return []
    } catch (error) {
        console.error('Error fetching course:', error);
        return [];
    }

}

/**
 * Gets a course and its chapters from Chessable
 * @param bid - The book ID to fetch
 * @param lines - Maximum number of lines to fetch (default: 10000)
 * @returns Tuple of [pgn content, course name]
 */
export async function getCourse(
    bid: string,
    lines: number = 10000,
    chapterCounterCallback?: ChapterCounterCallback,
    lineCounterCallback?: LineCounterCallback
): Promise<[string, string]> {
    let cumLines = 0;
    let courseName = '';
    const pgn: string[] = [];
    const uid = AuthUtils.getUserId()
    debugger
    if (!uid) {
        throw new Error('User ID is missing. Please log in first.');
    }

    const url = `https://www.chessable.com/api/v1/getCourse?uid=${encodeURIComponent(uid)}&bid=${encodeURIComponent(bid)}`;

    try {
        // Fetch course data
        const courseData = await makeRequest(url, 'GET' as Method) as ResponseCourse;

        if (!courseData || !courseData.course) {
            return ['', ''];
        }        // Process each chapter
        let chapterCounter = 0;
        for (let i = 0; i < courseData.course.data.length; i++) {
            chapterCounter++;

            // Download chapter using the extracted function
            courseName = await downloadChapter(
                chapterCounter,
                courseData,
                bid,
                pgn,
                cumLines,
                lines,
                chapterCounterCallback,
                lineCounterCallback
            );

            // Check if we've reached the line limit
            if (lines <= cumLines) {
                break;
            }
        }
    } catch (error) {
        console.error('Error fetching course:', error);
        return ['', ''];
    }
    return [pgn.join(''), courseName];
}
