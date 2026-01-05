// v2/controller.js
// The V2 Pipeline for Data Persistence and Logic

export async function handleV2Request(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace('/v2', '');
    const requestOrigin = request.headers.get('Origin');
    const corsHeaders = setCorsHeaders(requestOrigin);

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
        if (path === '/track') return await handleTrackUser(request, env, corsHeaders);
        if (path === '/submit-score') return await handleSubmitScore(request, env, corsHeaders);
        if (path === '/attempt') return await handleAttempt(request, env, corsHeaders);
        if (path === '/leaderboard') return await handleGetLeaderboard(request, env, corsHeaders);
        
        return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
}

// ----------------------------------------------------------------------------
// 1. User Tracking (The "Handshake")
// ----------------------------------------------------------------------------
async function handleTrackUser(request, env, corsHeaders) {
    const userId = getUserIdFromCookie(request) || crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    let name = null;

    if (request.method === 'POST') {
        const body = await request.json();
        name = body.name;
    }

    // Upsert User_v2
    let user = await env.DB.prepare("SELECT * FROM Users_v2 WHERE id = ?").bind(userId).first();
    
    if (!user) {
        await env.DB.prepare(
            "INSERT INTO Users_v2 (id, name, created_at, last_active_at) VALUES (?, ?, ?, ?)"
        ).bind(userId, name, now, now).run();
    } else {
        await env.DB.prepare(
            "UPDATE Users_v2 SET last_active_at = ?, name = COALESCE(?, name) WHERE id = ?"
        ).bind(now, name, userId).run();
    }

    const response = new Response(JSON.stringify({ 
        success: true, 
        userId, 
        name: name || user?.name 
    }), { status: 200, headers: corsHeaders });

    return setUserIdCookie(response, userId);
}

// ----------------------------------------------------------------------------
// 2. Score Submission (The "Transaction")
// ----------------------------------------------------------------------------
async function handleSubmitScore(request, env, corsHeaders) {
    const userId = getUserIdFromCookie(request);
    if (!userId) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { correct, total, timeMs, mode, tags } = await request.json();

    // VALIDATION: Strict Logic Enforcement
    if (typeof correct !== 'number' || typeof total !== 'number') {
        return new Response("Invalid data types", { status: 400, headers: corsHeaders });
    }
    if (correct > total) {
        return new Response("Integrity Error: Correct answers cannot exceed total.", { status: 400, headers: corsHeaders });
    }
    if (total === 0) {
        return new Response("Ignored: Total questions is 0.", { status: 200, headers: corsHeaders });
    }

    const now = Math.floor(Date.now() / 1000);

    // BATCH OPERATION: Record Session & Update Leaderboard
    const batch = [
        // 1. Log Session
        env.DB.prepare(`
            INSERT INTO Sessions_v2 (user_id, score, total_questions, time_taken_ms, timestamp, mode, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(userId, correct, total, timeMs, now, mode || 'standard', JSON.stringify(tags || [])),

        // 2. Update Leaderboard (Atomic Upsert)
        env.DB.prepare(`
            INSERT INTO Leaderboard_v2 (user_id, total_correct, total_attempted, total_sessions, total_time_ms)
            VALUES (?, ?, ?, 1, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                total_correct = total_correct + ?,
                total_attempted = total_attempted + ?,
                total_sessions = total_sessions + 1,
                total_time_ms = total_time_ms + ?
        `).bind(userId, correct, total, timeMs, correct, total, timeMs)
    ];

    await env.DB.batch(batch);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
}

// ----------------------------------------------------------------------------
// 3. Question Attempt (The "Granular Log")
// ----------------------------------------------------------------------------
async function handleAttempt(request, env, corsHeaders) {
    const userId = getUserIdFromCookie(request);
    if (!userId) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { question_id, is_correct, user_answer } = await request.json();
    const now = Math.floor(Date.now() / 1000);

    // Normalize Boolean
    const correctVal = is_correct ? 1 : 0;

    await env.DB.prepare(`
        INSERT INTO Attempts_v2 (user_id, question_id, is_correct, timestamp, user_answer)
        VALUES (?, ?, ?, ?, ?)
    `).bind(userId, question_id, correctVal, now, JSON.stringify(user_answer)).run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
}

// ----------------------------------------------------------------------------
// 4. Leaderboard Read (The "View")
// ----------------------------------------------------------------------------
async function handleGetLeaderboard(request, env, corsHeaders) {
    // Join with Users_v2 to get names
    const { results } = await env.DB.prepare(`
        SELECT 
            U.name, 
            L.total_correct, 
            L.total_attempted,
            L.average_accuracy,
            L.total_time_ms
        FROM Leaderboard_v2 L
        JOIN Users_v2 U ON L.user_id = U.id
        WHERE U.name IS NOT NULL
        ORDER BY L.average_accuracy DESC, L.total_correct DESC
        LIMIT 50
    `).all();

    return new Response(JSON.stringify(results), { status: 200, headers: corsHeaders });
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function getUserIdFromCookie(request) {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const val = cookies.find(c => c.startsWith('User-ID='));
    return val ? val.split('=')[1] : null;
}

function setUserIdCookie(response, userId) {
    response.headers.append('Set-Cookie', `User-ID=${userId}; Path=/; Max-Age=${60 * 60 * 24 * 365}; HttpOnly; Secure; SameSite=None; Partitioned`);
    return response;
}

function setCorsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie',
        'Access-Control-Allow-Credentials': 'true'
    };
}
