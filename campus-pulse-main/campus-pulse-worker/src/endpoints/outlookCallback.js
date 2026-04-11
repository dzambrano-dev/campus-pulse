import { jsonError, withSessionCookie } from "../utils.js";

export async function outlookCallback(request, env) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code"); // Microsoft sends a temporary code here

    if (!code) return jsonError("Authorization code missing", 400);

    // 1. Exchange the temporary code for a secure Access Token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: env.MS_CLIENT_ID,
            client_secret: env.MS_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code",
            redirect_uri: env.MS_REDIRECT_URI,
        }),
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) return jsonError("Token exchange failed", 401);

    // 2. Use the Access Token to ask Microsoft Graph for the user's details
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const outlookUser = await userResponse.json();

    // 3. Sync the Outlook user with your existing USERS KV system
    const username = outlookUser.mail.split("@")[0].toLowerCase();
    let storedUser = await env.USERS.get(username);
    
    if (!storedUser) {
        // Create a new account if they've never logged in before
        const newUser = {
            email: outlookUser.mail.toLowerCase(),
            role: "user",
            interests: [],
            provider: "outlook" // Keep track that this is an Outlook account
        };
        await env.USERS.put(username, JSON.stringify(newUser));
        await env.EMAILS.put(outlookUser.mail.toLowerCase(), username);
    }

    // 4. Create a session (Matching your login.js logic)
    const token = crypto.randomUUID();
    const maxAge = 60 * 60 * 24 * 7; // 1 week
    await env.SESSIONS.put(token, username, { expirationTtl: maxAge });

    // 5. Redirect the user back to your frontend app
    // Note: We use 302 redirect so the browser moves from the API back to the UI
    const response = new Response(null, {
        status: 302,
        headers: { "Location": "https://dzambrano-dev.github.io/app.html" }
    });
    
    return withSessionCookie(response, token, maxAge);
}