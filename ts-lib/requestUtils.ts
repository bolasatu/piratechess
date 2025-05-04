import axios, { AxiosRequestConfig, Method } from 'axios';

class PirateChessLib {
    private static generateRequestConfig(bearer: string, method: Method): AxiosRequestConfig {
        return {
            method: method,
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'platform': 'Web',
                'x-os-name': 'Firefox',
                'x-os-version': '138',
                'x-device-model': 'Windows',
                'authorization': `Bearer ${bearer}`,
                'alt-used': 'www.chessable.com',
                'connection': 'keep-alive',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'priority': 'u=0',
                'te': 'trailers',
                'pragma': 'no-cache',
                'cache-control': 'no-cache',
            },
        };
    }

    public static async makeRequest(url: string, bearer: string, method: Method): Promise<any> {
        const config = this.generateRequestConfig(bearer, method);
        config.url = url;

        try {
            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error('Error making request:', error);
            throw error;
        }
    }
}