import { handleV2Request } from './v2/controller.js';

async function handleGenAILogging(request, env) {
    const requestOrigin = request.headers.get('Origin');
    const corsHeaders = setCorsHeaders(requestOrigin);
    
    if (request.method !== 'POST') return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

    try {
        const { user_id, model, tokens_input, tokens_output, cost_usd, endpoint, request_payload, response_payload } = await request.json();
        const now = Math.floor(Date.now() / 1000);

        if (!user_id) return new Response(JSON.stringify({ error: "Missing user_id" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });

        try {
            // Primary: Try inserting with payloads (New Schema)
            await env.DB.prepare(
                "INSERT INTO GenAIUsage (user_id, model, tokens_input, tokens_output, cost_usd, endpoint, timestamp, request_payload, response_payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(user_id, model, tokens_input, tokens_output, cost_usd, endpoint, now, request_payload, response_payload).run();
        } catch (schemaError) {
            console.warn("GenAI Logging: Full insert failed, attempting fallback (Old Schema). Error:", schemaError.message);
            // Fallback: Try inserting without payloads (Old Schema)
            await env.DB.prepare(
                "INSERT INTO GenAIUsage (user_id, model, tokens_input, tokens_output, cost_usd, endpoint, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)"
            ).bind(user_id, model, tokens_input, tokens_output, cost_usd, endpoint, now).run();
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to log usage", details: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
}

async function handleAdminGenAI(request, env) {
    const requestOrigin = request.headers.get('Origin');
    const corsHeaders = setCorsHeaders(requestOrigin);
    
    try {
        // Fetch latest 50 logs with payload fields, and join with Users
        const { results } = await env.DB.prepare(`
            SELECT 
                G.id, G.user_id, G.model, G.tokens_input, G.tokens_output, 
                G.cost_usd, G.endpoint, G.timestamp, G.request_payload, G.response_payload,
                U.name 
            FROM GenAIUsage G
            LEFT JOIN Users U ON G.user_id = U.id
            ORDER BY G.timestamp DESC 
            LIMIT 50
        `).all();
        return new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch GenAI logs", details: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
}

// Helper to get user ID from cookie
function getUserIdFromCookie(request) {
    const cookieHeader = request.headers.get('Cookie');
    const cookies = cookieHeader ? cookieHeader.split(';').map(c => c.trim()) : [];
    const userIdCookie = cookies.find(cookie => cookie.startsWith('User-ID='));
    
    if (userIdCookie) {
        return userIdCookie.split('=')[1];
    }
    return generateUUID();
}

// Helper to generate a UUID
function generateUUID() {
    return crypto.randomUUID();
}

// Helper to set user ID in a cookie
function setUserIdCookie(response, userId) {
    response.headers.append('Set-Cookie', `User-ID=${userId}; Path=/; Max-Age=${60 * 60 * 24 * 365 * 10}; HttpOnly; Secure; SameSite=None; Partitioned`);
    return response;
}

function setCorsHeaders(requestOrigin) {
  const defaultOrigin = 'https://your-domain.com';
  let allowedOrigin = defaultOrigin;

  const ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://your-domain.com'
  ];

  if (requestOrigin) {
      if (ALLOWED_ORIGINS.includes(requestOrigin) || requestOrigin.endsWith('.your-domain.com')) {
          allowedOrigin = requestOrigin;
      }
  }
  
  return {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With, Authorization, X-Title, HTTP-Referer, X-User-ID',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true'
  };
}

function handleOptions(request) {
  const requestOrigin = request.headers.get('Origin');
  const corsHeaders = setCorsHeaders(requestOrigin);
  if (
      requestOrigin !== null &&
      request.headers.get('Access-Control-Request-Method') !== null &&
      request.headers.get('Access-Control-Request-Headers') !== null
  ) {
      return new Response(null, { status: 204, headers: corsHeaders });
  } else {
      return new Response(null, { headers: { Allow: 'GET, POST, OPTIONS', ...corsHeaders } });
  }
}

async function handleUserTracking(request, env) {
    const requestOrigin = request.headers.get('Origin');
    const corsHeaders = setCorsHeaders(requestOrigin);
    let userId = getUserIdFromCookie(request);
    const now = Math.floor(Date.now() / 1000);

    // Register Name
    if (request.method === 'POST') {
        try {
             if (request.headers.get('content-type')?.includes('application/json')) {
                 const body = await request.json();
                 if (body.name) {
                     await env.DB.prepare("UPDATE Users SET name = ? WHERE id = ?").bind(body.name, userId).run();
                     return new Response(JSON.stringify({ success: true, message: "Name registered" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
                 }
             }
        } catch (e) { /* ignore if no json body */ }
    }

    // Tracking Logic
    try {
        let userRecord = await env.DB.prepare("SELECT * FROM Users WHERE id = ?").bind(userId).first();
        
        if (!userRecord) {
            await env.DB.prepare("INSERT INTO Users (id, name, first_visit_at, last_visit_at, visit_count) VALUES (?, ?, ?, ?, ?)").bind(userId, null, now, now, 1).run();
            userRecord = { id: userId, name: null, first_visit_at: now, last_visit_at: now, visit_count: 1 };
        } else {
            const newVisitCount = userRecord.visit_count + 1;
            await env.DB.prepare("UPDATE Users SET last_visit_at = ?, visit_count = ? WHERE id = ?").bind(now, newVisitCount, userId).run();
            userRecord.last_visit_at = now;
            userRecord.visit_count = newVisitCount;
        }

        let response = new Response(JSON.stringify({
            userId: userRecord.id,
            name: userRecord.name,
            visitCount: userRecord.visit_count,
            firstVisit: userRecord.first_visit_at,
            lastVisit: userRecord.last_visit_at
        }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });

        return setUserIdCookie(response, userId);
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to track user visit", details: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
}

async function handleUserUsage(request, env) {
    const requestOrigin = request.headers.get('Origin');
    const corsHeaders = setCorsHeaders(requestOrigin);
    const userId = getUserIdFromCookie(request);

    if (!userId) return new Response(JSON.stringify({ error: "User ID not found." }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });

    try {
        const result = await env.DB.prepare(
            "SELECT SUM(tokens_input) as in_tokens, SUM(tokens_output) as out_tokens, SUM(cost_usd) as total_cost FROM GenAIUsage WHERE user_id = ?"
        ).bind(userId).first();

        // If no usage, return zeros
        const data = result || { in_tokens: 0, out_tokens: 0, total_cost: 0 };
        return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch usage", details: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
}

async function handleQuizAttempt(request, env) {
    const requestOrigin = request.headers.get('Origin');
    const corsHeaders = setCorsHeaders(requestOrigin);
    const userId = getUserIdFromCookie(request);

    if (!userId) return new Response(JSON.stringify({ error: "User ID not found in cookie." }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });

    try {
        const { question_id, is_correct, chapter, set_name, tags, platform_mode, user_answer, name } = await request.json();
        const now = Math.floor(Date.now() / 1000);

        if (!question_id || is_correct === undefined || !chapter || !set_name) {
            return new Response(JSON.stringify({ error: "Missing required fields." }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
        
        // Ensure Name is Synced
        if (name) {
            await env.DB.prepare("UPDATE Users SET name = ? WHERE id = ?").bind(name, userId).run();
        }
        
        const tagsString = Array.isArray(tags) ? tags.join(',') : (tags || null);

        try {
            await env.DB.prepare(
                "INSERT INTO QuizAttempts (user_id, question_id, is_correct, attempted_at, chapter, set_name, tags, platform_mode, user_answer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(userId, question_id, is_correct ? 1 : 0, now, chapter, set_name, tagsString, platform_mode || 'unknown', user_answer || null).run();
        } catch (e) {
            // Fallback for old schema
            await env.DB.prepare(
                "INSERT INTO QuizAttempts (user_id, question_id, is_correct, attempted_at, chapter, set_name, tags, platform_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(userId, question_id, is_correct ? 1 : 0, now, chapter, set_name, tagsString, platform_mode || 'unknown').run();
        }

        return new Response(JSON.stringify({ success: true, message: "Quiz attempt recorded." }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to record quiz attempt", details: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
}

async function handleLeaderboardSubmission(request, env) {
    const requestOrigin = request.headers.get('Origin');
    const corsHeaders = setCorsHeaders(requestOrigin);
    const userId = getUserIdFromCookie(request);

    if (!userId) return new Response(JSON.stringify({ error: "User ID not found." }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });

    try {
        const { total_correct, total_questions, time_taken_ms, name } = await request.json();
        if (total_correct === undefined || total_questions === undefined || time_taken_ms === undefined) {
            return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }
        
        // Ensure Name is Synced
        if (name) {
            await env.DB.prepare("UPDATE Users SET name = ? WHERE id = ?").bind(name, userId).run();
        }
        
        const currentScorePercent = total_questions > 0 ? (total_correct / total_questions) * 100 : 0;

        await env.DB.prepare(`
            INSERT INTO Leaderboard (user_id, total_correct, total_attempted, last_quiz_score, last_quiz_total_questions, total_time_taken_ms, average_score_percent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                total_correct = Leaderboard.total_correct + EXCLUDED.total_correct,
                total_attempted = Leaderboard.total_attempted + EXCLUDED.total_attempted,
                last_quiz_score = EXCLUDED.last_quiz_score,
                last_quiz_total_questions = EXCLUDED.last_quiz_total_questions,
                total_time_taken_ms = Leaderboard.total_time_taken_ms + EXCLUDED.total_time_taken_ms,
                average_score_percent = (
                    (CAST(Leaderboard.total_correct AS REAL) + EXCLUDED.total_correct) /
                    (CAST(Leaderboard.total_attempted AS REAL) + EXCLUDED.total_attempted)
                ) * 100
        `).bind(userId, total_correct, total_questions, total_correct, total_questions, time_taken_ms, currentScorePercent).run();

        return new Response(JSON.stringify({ success: true, message: "Leaderboard updated." }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to submit results", details: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
}

async function handleUserHistory(request, env) {
    const requestOrigin = request.headers.get('Origin');
    const corsHeaders = setCorsHeaders(requestOrigin);
    const userId = getUserIdFromCookie(request);

    if (!userId) return new Response(JSON.stringify({ error: "User ID not found." }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');

    try {
        let query = "SELECT question_id, is_correct, attempted_at, chapter, set_name, tags, platform_mode FROM QuizAttempts WHERE user_id = ?";
        
        if (mode === 'all') {
            query += " ORDER BY attempted_at DESC"; // Full history
        } else {
            query += " AND is_correct = 0 ORDER BY attempted_at DESC LIMIT 100"; // Default: Wrong only
        }

        const { results } = await env.DB.prepare(query).bind(userId).all();

        return new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch history", details: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
}

async function handleLeaderboardApi(request, env) {
    const requestOrigin = request.headers.get('Origin');
    const corsHeaders = setCorsHeaders(requestOrigin);

    try {
        const { results } = await env.DB.prepare(`
            SELECT
                U.name AS Name,
                L.total_correct AS Correctcount,
                L.total_attempted AS Totalquestions,
                L.total_time_taken_ms AS TimetakenMs,
                U.id AS UserId
            FROM Leaderboard L
            JOIN Users U ON L.user_id = U.id
            WHERE U.name IS NOT NULL
            ORDER BY L.average_score_percent DESC, L.total_correct DESC
        `).all();

        const formattedResults = results.map(row => ({
            ...row,
            Timetaken: `${String(Math.floor(row.TimetakenMs / 60000)).padStart(2, '0')}m ${String(Math.floor((row.TimetakenMs % 60000) / 1000)).padStart(2, '0')}s`,
            Profilepictureurl: `https://robohash.org/${encodeURIComponent(row.Name || 'User')}?set=set4&bg=bg1&size=60x60`
        }));
        
        return new Response(JSON.stringify(formattedResults), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch leaderboard", details: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
}

async function handleAdminUsers(request, env) {
    const requestOrigin = request.headers.get('Origin');
    const corsHeaders = setCorsHeaders(requestOrigin);
    try {
        const { results } = await env.DB.prepare("SELECT id, name, last_visit_at, visit_count FROM Users ORDER BY last_visit_at DESC").all();
        return new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch users", details: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
}

async function handleAdminUserAttempts(request, env) {
    const requestOrigin = request.headers.get('Origin');
    const corsHeaders = setCorsHeaders(requestOrigin);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });

    try {
        let results;
        try {
            const res = await env.DB.prepare("SELECT question_id, is_correct, attempted_at, chapter, tags, platform_mode, set_name, user_answer FROM QuizAttempts WHERE user_id = ?").bind(userId).all();
            results = res.results;
        } catch (e) {
            const res = await env.DB.prepare("SELECT question_id, is_correct, attempted_at, chapter, tags, platform_mode, set_name FROM QuizAttempts WHERE user_id = ?").bind(userId).all();
            results = res.results;
        }
        return new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch attempts", details: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (request.method === 'OPTIONS') return handleOptions(request);

        if (url.pathname === '/track' || url.pathname === '/register') return handleUserTracking(request, env);
        if (url.pathname === '/attempt') return handleQuizAttempt(request, env);
        if (url.pathname === '/history') return handleUserHistory(request, env);
        if (url.pathname === '/usage') return handleUserUsage(request, env);
        if (url.pathname === '/leaderboard') {
            if (request.method === 'GET') return handleLeaderboardApi(request, env);
            if (request.method === 'POST') return handleLeaderboardSubmission(request, env);
        }
        if (url.pathname === '/log-usage') return handleGenAILogging(request, env);
        
        // Admin Routes
        if (url.pathname === '/admin/users') return handleAdminUsers(request, env);
        if (url.pathname === '/admin/attempts') return handleAdminUserAttempts(request, env);
        if (url.pathname === '/admin/genai') return handleAdminGenAI(request, env);

        // V2 Routes - The Pipeline
        if (url.pathname.startsWith('/v2')) {
            return handleV2Request(request, env);
        }

        return new Response('Leaderboard Worker: Use /track, /attempt, /leaderboard, /history, /log-usage', { status: 200, headers: setCorsHeaders(request.headers.get('Origin')) });
    }
};