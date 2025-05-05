// File: ts-lib/src/PirateChessLib.ts

import { Method } from 'axios';
import { makeRequest } from './requestUtils';
import { Store } from './Store';

//
// minimal JSON types for getHomeData
//
interface ChapterItem {
    bid: number;
    name: string;
}

interface HomeData {
    booksList: ChapterItem[];
}

interface GetHomeDataResponse {
    homeData: HomeData;
}

// Model interfaces for chapter functionality
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

/**
 * Fetches all chapters (books) for the current user and returns
 * a map of bid → name.
 * @param uid - The user ID to fetch chapters for
 */
export async function getChapters(uid: string): Promise<Record<string, string>> {
    const chapters: Record<string, string> = {};
    const url = `https://www.chessable.com/api/v1/getHomeData` +
        `?uid=${encodeURIComponent(uid)}` +
        `&sortBookRowsBy=alphabetically` +
        `&userLanguageShort=en`;

    // makeRequest() is a thin wrapper over axios that
    // applies your common headers and returns .data
    const data = (await makeRequest(
        url,
        'GET' as Method
    )) as GetHomeDataResponse;

    for (const item of data.homeData.booksList) {
        // cast bid to string for the key
        chapters[item.bid.toString()] = item.name;
    }

    return chapters;
}

/**
 * Downloads a chapter from the course
 * @param chapterCounter - Current chapter counter
 * @param courseData - The course data containing chapters
 * @param bid - The book ID
 * @param pgn - Array to store PGN content
 * @param cumLines - Cumulative line counter
 * @param lines - Maximum number of lines to fetch
 * @param chapterCounterCallback - Callback to update chapter progress
 * @param lineCounterCallback - Callback to update line progress
 * @returns Promise with course name
 */
export async function downloadChapter(
    chapterCounter: number,
    courseData: ResponseCourse,
    bid: string,
    pgn: string[],
    cumLines: number,
    lines: number = 10000,
    chapterCounterCallback?: (message: string) => void,
    lineCounterCallback?: (message: string) => void
): Promise<string> {
    let courseName = '';
    const item = courseData.course.data[chapterCounter - 1];
    
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
    
    return courseName;
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
    lineCounterCallback?: (message: string) => void
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
