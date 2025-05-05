import { Method } from 'axios';
import { makeRequest } from './requestUtils';
import { Store } from './Store';
import {AuthUtils} from "./AuthUtils.ts";

// Model interfaces
interface ResponseCourse {
    course: Course;
}

interface Course {
    data: Chapter[];
}

interface Chapter {
    id: number;
}

interface ResponseChapter {
    list: ResponseList;
}

interface ResponseList {
    name: string;
    data: Line[];
    title: string;
}

interface Line {
    id: number;
    name: string;
}

interface ResponseLine {
    game: Game;
}

interface Game {
    owned: boolean;
    data: JsonMove[];
    initial: string;
}

interface JsonMove {
    id: number;
    move: number;
    san: string;
    after: string;
    before: string;
    commentAfter?: string;
    commentBefore?: string;
}

interface ResponseMove {
    before: string;
    after: string;
    data: JsonMoveItemList[];
}

interface JsonMoveItemList {
    commentAfter: string;
    commentBefore: string;
}

interface PgnInfo {
    event: string;
    round: number;
    subround: number;
    white: string;
    black: string;
    fen: string;
}

// Event callback types
type ChapterCounterCallback = (message: string) => void;
type LineCounterCallback = (message: string) => void;

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
        }
        
        // Process each chapter
        let chapterCounter = 0;
        for (const item of courseData.course.data) {
            chapterCounter++;
            
            // Update UI with progress if callback provided
            if (chapterCounterCallback) {
                chapterCounterCallback(`${chapterCounter} / ${courseData.course.data.length}`);
            }
            
            // Get chapter data
            courseName = await getChapter(
                lines, 
                chapterCounter, 
                bid, 
                item.id.toString(), 
                pgn,
                cumLines,
                lineCounterCallback
            );
            
            // Add random delay between requests (500-1500ms)
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 500));
            
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

/**
 * Gets a chapter from Chessable
 * @private
 */
async function getChapter(
    lines: number,
    chapter: number,
    bid: string,
    lid: string,
    pgn: string[],
    cumLines: number,
    lineCounterCallback?: LineCounterCallback
): Promise<string> {
    const uid = Store.get('uid') || '';
    const url = `https://www.chessable.com/api/v1/getList?uid=${encodeURIComponent(uid)}&bid=${encodeURIComponent(bid)}&lid=${encodeURIComponent(lid)}`;
    
    try {
        const chapterData = await makeRequest(url, 'GET' as Method) as ResponseChapter;
        const courseName = chapterData.list.name;
        let count = 0;
        
        for (const line of chapterData.list.data) {
            count++;
            
            // Update UI with progress if callback provided
            if (lineCounterCallback) {
                lineCounterCallback(`${count} / ${chapterData.list.data.length}`);
            }
            
            const pgnHeader: PgnInfo = {
                event: chapterData.list.name,
                round: chapter + 1,
                subround: count + 1,
                white: line.name,
                black: chapterData.list.title,
                fen: ''
            };
            
            await getLine(pgnHeader, line.id.toString(), pgn, cumLines);
            
            if (lines < cumLines) {
                break;
            }
        }
        
        return courseName;
    } catch (error) {
        console.error('Error fetching chapter:', error);
        return '';
    }
}

/**
 * Gets a line from Chessable
 * @private
 */
async function getLine(
    pgnHeader: PgnInfo,
    oid: string,
    pgn: string[],
    cumLines: number,
    jsonData?: string
): Promise<void> {
    let content = '';
    const uid = Store.get('uid') || '';
    
    if (!jsonData) {
        const url = `https://www.chessable.com/api/v1/getGame?lng=en&uid=${encodeURIComponent(uid)}&oid=${encodeURIComponent(oid)}`;
        try {
            const response = await makeRequest(url, 'GET' as Method);
            content = JSON.stringify(response);
        } catch (error) {
            console.error('Error fetching line:', error);
            return;
        }
    } else {
        content = jsonData;
    }
    
    if (content) {
        const game = JSON.parse(content) as ResponseLine;
        const pgnMoves = generatePGN(game.game);
        
        pgnHeader.fen = game.game.initial || '';
        cumLines++;
        
        pgn.push(`
[Event "${pgnHeader.event}"]
[Round "${String(pgnHeader.round).padStart(3, '0')}.${String(pgnHeader.subround).padStart(3, '0')}"]
[White "${pgnHeader.white}"]
[Black "${pgnHeader.black}"]
[FEN "${pgnHeader.fen}"]
[Result "*"]

${pgnMoves}


`);
    }
}

/**
 * Generates PGN notation from game data
 * @private
 */
function generatePGN(game: Game): string {
    let pgn = '';
    const sortedMoves: Record<number, JsonMove> = {};
    
    if (!game.data) {
        return pgn;
    }
    
    // Sort and process moves
    for (const move of game.data) {
        sortedMoves[move.id] = move;
        
        // Process "after" comments
        if (move.after) {
            try {
                const responseMoveAfter = JSON.parse(move.after) as ResponseMove;
                if (responseMoveAfter && responseMoveAfter.data) {
                    move.commentAfter = responseMoveAfter.data
                        .map(x => x.commentAfter)
                        .filter(Boolean)
                        .join('\n');
                }
            } catch (e) {
                console.error('Error parsing move.after:', e);
            }
        }
        
        // Process "before" comments
        if (move.before) {
            try {
                const responseMoveBefore = JSON.parse(move.before) as ResponseMove;
                if (responseMoveBefore && responseMoveBefore.data) {
                    move.commentBefore = responseMoveBefore.data
                        .map(x => x.commentBefore)
                        .filter(Boolean)
                        .join('\n');
                }
            } catch (e) {
                console.error('Error parsing move.before:', e);
            }
        }
    }
    
    // Generate PGN string
    let lastMove = 0;
    const sortedIds = Object.keys(sortedMoves).map(Number).sort((a, b) => a - b);
    
    for (const id of sortedIds) {
        const move = sortedMoves[id];
        
        if (move.commentBefore) {
            pgn += `{${move.commentBefore}} `;
        }
        
        if (lastMove < move.move) {
            pgn += `${move.move}. `;
        }
        
        pgn += `${move.san} `;
        
        if (move.commentAfter) {
            pgn += `{${move.commentAfter}} `;
        }
        
        lastMove = move.move;
    }
    
    return pgn;
}
