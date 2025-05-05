import axios from 'axios';
import {SHA512} from 'crypto-js';
import {Store} from './Store';
import {AuthUtils} from './AuthUtils';

/**
 * Computes a SHA-512 hash of the input string
 * @param input - The string to hash
 * @returns The SHA-512 hash as a hexadecimal string
 */
function computeSha512Hash(input: string): string {
    return SHA512(input).toString();
}

/**
 * Extracts the user ID from a JWT token following the same logic as JwtHelper.cs
 * @param token - The JWT token
 * @returns The user ID extracted from the token
 */
function extractUidFromToken(token: string): string {
    return AuthUtils.extractUidFromToken(token);
}

const proxyUrl = 'http://localhost:8880/' //http://cors-anywhere.herokuapp.com/' // Replace with your proxy URL
export async function login(emailInput: string, pwdInput: string): Promise<string> {
    if (!emailInput) {
        return "please fill out email.";
    }
    if (!pwdInput) {
        return "please fill out password.";
    }

    const hash = computeSha512Hash(pwdInput);
    if (hash !== "857f0e74d24470aeb50ec2762a30f875d809ee709d06925e490608cc956594f4c86064267ed9c9b3b3b02e6532264f7fb924871412205d8050968dae73fac9fa") {
        throw new Error("Hash does not match '");
    }

    const requestBody = {
        method: "email",
        credentials: {
            email: emailInput,
            password: hash
        },
        providerData: null,
        mode: "login",
        checkoutData: null,
        preferredLanguage: "en",
        newsletterChecked: false
    };

    try {
        const response = await axios.post(proxyUrl + 'https://www.chessable.com/api/v1/authenticate', requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0'
            }
        });

        if (response.status !== 200) {
            return response.data;
        }

        const responseLogin = response.data;
        debugger
        if (responseLogin && responseLogin.jwt) {
            const bearer = responseLogin.jwt;
            const uid = extractUidFromToken(bearer);

            console.log('Extracted UID:', uid);

            // Store bearer and uid using the Store class
            Store.set('jwt_token', bearer);
            Store.set('user_id', uid);

            return uid;
        }

        return "";
    } catch (error: any) {
        return error.message || "An error occurred.";
    }
}

