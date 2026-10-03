import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { usersRepo } from "@bother-me-not/db";
import { config } from "../../config.js";


/*

typical structure for github oauth
- login with github, sends a get to github with user details
- if verified, returns to callback function

*/


interface GithubTokenResponse {
    access_token?: string;
    error?: string;
}

interface GithubUserResponse{
    id: number;
    login: string;
    email: string | null;
    avatar_url: string | null;
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {

    app.get("/auth/github", async (request, reply) => {
        const state = crypto.randomBytes(16).toString("hex");

        reply.setCookie("oauth_state", state, {
            httpOnly: true,
            maxAge: 600,
            path: "/",
        });

        const url = new URL("https://github.com/login/oauth/authorize");
        // building rest of the url
        url.searchParams.set("client_id", config.github.clientId);
        url.searchParams.set("redirect_uri", config.github.redirectUri);
        url.searchParams.set("scope", "read:user user:email")
        url.searchParams.set("state", state);

        return reply.redirect(url.toString());
    });

    app.get("/auth/github/callback", async (request, reply) => {
        const { code, state } = request.query as { code?: string; state?: string };
        const cookieState = request.cookies.oauth_state;

        reply.clearCookie("oauth_state");

        if(!code || !state || state !== cookieState){
            return reply.code(400).send({ error: "Invalid OAuth state"});
        }

        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: config.github.clientId,
                client_secret: config.github.clientSecret,
                code,
                redirect_uri: config.github.redirectUri,
            }),
        });

        const tokenData = (await tokenRes.json()) as GithubTokenResponse;

        if(!tokenData.access_token) {
            request.log.warn({ error: tokenData.error }, "Github token exchange failed");
            return reply.code(401).send({ error: "Github token exhange failed" });
        }

        const profileRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                "User-Agent": "bother-me-not",
            },
        });

        const profile = (await profileRes.json()) as GithubUserResponse;

        const user = await usersRepo.findOrCreateFromGithub({
            id: profile.id,
            login: profile.login,
            email: profile.email,
            avatarUrl: profile.avatar_url,
            accessToken: tokenData.access_token,
        });

        const token = app.jwt.sign({ userId: user.id });

        reply.setCookie("session", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
        });

        return reply.redirect(`${config.webBaseUrl}/dashboard`);
    });


    app.get("/auth/me", { preHandler: app.authenticate }, async (request, reply) => {
        const user = await usersRepo.findById(request.user.userId);
        if (!user) {
            return reply.code(404).send({ error: "User not found" });
        }
        return user;
    });

    app.post("/auth/logout", async (_request, reply) => {
        reply.clearCookie("session", { path: "/" });
        return { loggedOut: true };
    });
}
