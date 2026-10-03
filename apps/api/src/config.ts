

import { createPrivateKey } from "node:crypto";

// checks if env variables are there
function required(name: string) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required env var: ${name}`);
    return value;
}


const appBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";

// Buffer.from(..., "base64") never throws on bad input, so parse the key here to fail at boot
const githubAppPrivateKey = Buffer.from(required("GITHUB_APP_PRIVATE_KEY"), "base64").toString("utf8");
try {
    createPrivateKey(githubAppPrivateKey);
} catch {
    throw new Error("GITHUB_APP_PRIVATE_KEY is not a valid base64-encoded PEM private key");
}


// module-level object
export const config = {
    port: Number(process.env.PORT ?? 3000),
    appBaseUrl,
    // where the browser is sent after login (apps/web)
    webBaseUrl: process.env.WEB_BASE_URL ?? "http://localhost:5173",
    jwtSecret: required("JWT_SECRET"),
    github: {
        clientId: required("GITHUB_OAUTH_CLIENT_ID"),
        clientSecret: required("GITHUB_OAUTH_CLIENT_SECRET"),
        redirectUri: process.env.GITHUB_OAUTH_REDIRECT_URI ?? `${appBaseUrl}/auth/github/callback`,
    },
    githubApp: {
        appId: required("GITHUB_APP_ID"),
        slug: required("GITHUB_APP_SLUG"),
        privateKey: githubAppPrivateKey,
        webhookSecret: required("GITHUB_APP_WEBHOOK_SECRET"),
    },
};

