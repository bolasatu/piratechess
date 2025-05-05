import axios, { AxiosRequestConfig, Method } from 'axios';
import { Store } from './Store';
export const proxyUrl = 'http://localhost:8880/' //http://cors-anywhere.herokuapp.com/' // Replace with your proxy URL


export async function makeRequest(url: string,  method: Method): Promise<any> {

    const bearer = Store.get('jwt_token') || ''; // Retrieve the token from the Store class
    if (!bearer) {
        throw new Error('Bearer token is missing. Please log in first.');
    } 
    
    const config: AxiosRequestConfig = {
        method: method,
        url: proxyUrl + url,
        headers: {
            'Authorization': `Bearer ${bearer}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('Error making request:', error);
        throw error;
    }
}