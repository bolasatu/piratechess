// File: ts-lib/src/PirateChessLib.ts

import { Method } from 'axios';
import { makeRequest } from './requestUtils';

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
