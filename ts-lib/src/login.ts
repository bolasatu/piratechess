import axios from 'axios';

export async function login(emailInput: string, pwdInput: string): Promise<string> {
    if (!emailInput) {
        return "please fill out email.";
    }
    if (!pwdInput) {
        return "please fill out password.";
    }

    const hash = computeSha512Hash(pwdInput);

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
        const response = await axios.post('https://www.chessable.com/api/v1/authenticate', requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0'
            }
        });

        if (response.status !== 200) {
            return response.data;
        }

        const responseLogin = response.data;

        if (responseLogin && responseLogin.jwt && responseLogin.uid) {
            const bearer = responseLogin.jwt;
            const uid = responseLogin.uid.toString();
            // Store bearer and uid as needed
        }

        return "";
    } catch (error: any) {
        return error.message || "An error occurred.";
    }
}

function computeSha512Hash(input: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = crypto.subtle.digestSync('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}
