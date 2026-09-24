

// checks if env variables are there
function required(name: string) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required env var: ${name}`);
    return value;
}


const appBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";


// module-level object
export const config = {
    port: Number(process.env),
    appBaseUrl,
    jwtSecret: required("JWT_SECRET"),
    github: {
        clientId: required("GITHUB_OAUTH_CLIENT_ID"),
        clientSecret: required("GITHUB_OAUTH_CLIENT_SECRET"),
        redirectUri: process.env.GITHUB_OAUTH_REDIRECT_URI ?? `${appBaseUrl}/auth/github/callback`,
    },
};

