import { jsonError, withSessionCookie } from "../utils.js";

export async function outlookCallback(request, env) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) return jsonError("Authorization code missing", 400);

    // 1. Exchange code for an access token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: env.MS_CLIENT_ID,
            client_secret: env.MS_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code",
            redirect_uri: env.MS_REDIRECT_URI,
        }).toString(),
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) return jsonError("Token exchange failed", 401);

    // 2. Get User Info from Microsoft Graph
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const outlookUser = await userResponse.json();

    // 3. Sync with your USERS and EMAILS KV namespaces
    const username = outlookUser.mail.split("@")[0].toLowerCase();
    let storedUser = await env.USERS.get(username);
    
    if (!storedUser) {
        const newUser = {
            email: outlookUser.mail.toLowerCase(),
            role: "user",
            interests: [],
            provider: "outlook"
        };
        await env.USERS.put(username, JSON.stringify(newUser));
        await env.EMAILS.put(outlookUser.mail.toLowerCase(), username);
    }

    // 4. Create Session
    const token = crypto.randomUUID();
    const maxAge = 60 * 60 * 24 * 7;
    await env.SESSIONS.put(token, username, { expirationTtl: maxAge });

    // 5. Redirect back to your GitHub Pages UI
    const response = new Response(null, {
        status: 302,
        headers: { "Location": "https://dzambrano-dev.github.io/campus-pulse/app.html" }
    });
    
    return withSessionCookie(response, token, maxAge);
}