// Helper to get user ID from header or cookie
function getUserId(request) {
    // 1. Check Header (Preferred for Cross-Origin)
    const headerId = request.headers.get('X-User-ID');
    if (headerId && headerId.trim() !== '') return headerId;

    // 2. Check Cookie
    const cookieHeader = request.headers.get('Cookie');
    const cookies = cookieHeader ? cookieHeader.split(';').map(c => c.trim()) : [];
    const userIdCookie = cookies.find(cookie => cookie.startsWith('User-ID='));
    if (userIdCookie) return userIdCookie.split('=')[1];
    return null;
}

// Helper to log usage to Beta Worker
function logUsage(env, userId, model, usage, endpoint, requestPayload = null, responsePayload = null) {
    if (!userId || !usage) return Promise.resolve();
    
    // Pricing (USD per 1M tokens) - Approximate/Hardcoded
    const rates = {
        'gpt-5-nano': { in: 0.15, out: 0.60 }, 
        'deepseek/deepseek-v3.2-exp': { in: 0.14, out: 0.28 }, 
        'openai/gpt-4o-mini': { in: 0.15, out: 0.60 },
        'google/gemini-2.5-flash': { in: 0.30, out: 2.50 }
    };
    
    const rate = rates[model] || { in: 0, out: 0 };
    const cost = ((usage.prompt_tokens * rate.in) + (usage.completion_tokens * rate.out)) / 1000000;
    
    try {
        // Ensure payloads are strings if they are objects
        const reqStr = typeof requestPayload === 'object' ? JSON.stringify(requestPayload) : requestPayload;
        const resStr = typeof responsePayload === 'object' ? JSON.stringify(responsePayload) : responsePayload;

        // return fetch('https://api-data.example.com/log-usage', { ... });
        return Promise.resolve(); 
    } catch (e) {
        console.error("Usage log error:", e);
        return Promise.resolve();
    }
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

async function handleQuizGeneration(request, env, ctx) {
  const requestOrigin = request.headers.get('Origin');
  const corsHeaders = setCorsHeaders(requestOrigin);
  const allowedCountries = ['BN', 'KH', 'ID', 'LA', 'MY', 'MM', 'PH', 'SG', 'TH', 'VN'];
  const clientCountry = request.cf.country;
  
  if (!allowedCountries.includes(clientCountry)) {
    const catImageHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Access Denied</title>
          <style>
              body { margin: 0; padding: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background-color: #000; color: #fff; font-family: sans-serif; }
              img { max-width: 100%; height: auto; }
              h1 { margin-top: 20px; text-align: center; }
          </style>
      </head>
      <body>
          <img src="https://http.cat/404" alt="404 Not Found">
          <h1>We only serve our SEAblings only. Please pay for access.</h1>
      </body>
      </html>
    `;
    return new Response(catImageHtml, { status: 403, headers: { 'Content-Type': 'text/html', ...corsHeaders } });
  }

  try {
    const formData = await request.formData();
    const subject = formData.get("subject");
    const chapter = formData.get("chapter");
    const tagsRaw = formData.get("tags");
    const requestedModel = formData.get("model");
    
    let tagsInstruction = "";
    if (tagsRaw) {
        let tagsList = [];
        try {
            tagsList = JSON.parse(tagsRaw);
        } catch {
            tagsList = tagsRaw.split(',').map(t => t.trim());
        }
        if (tagsList.length > 0) {
             tagsInstruction = `\n\n**CRITICAL INSTRUCTION**: Focus the questions on the following key topics/concepts: ${tagsList.join(', ')}. Ensure at least 50% of the generated questions directly address these specific concepts to help the student practice their weak areas.`;
        }
    }

    const SYSTEM_COMMAND = `**Role & Objective:**
You are an expert exam-question generator and advanced AI system. Your task is to create **self-contained, high-quality exam-style multiple-choice questions** for the ICAEW *Sustainability and Ethics* module. You must transform provided documents into structured questions that conform *strictly* to the given JSON schema.

1. **Checklist (before generating):**
   * Identify topic(s) from the provided chapter/document.
   * Create a short, unique business scenario (1–3 sentences, fictional company name included).
   * Write a clear exam-style question applying the topic to the scenario.
   * Provide **4–6 answer options** (1 correct, others plausible but wrong).
   * Ensure each option has an explanation.
   * Structure output strictly in the provided JSON schema.

2. **Scenario Construction:**
   * Invent a fictional company.
   * Describe a realistic ethical/sustainability dilemma.

3. **Question Writing:**
   * Ask the student to apply knowledge.
   * Avoid ambiguity.

4. **Answer Options:**
   * One Correct Answer.
   * 3–5 Distractors.

5. **Explanations:**
   * Educational, concise.

6. **Output Format:**
   * Produce **only valid JSON** matching the schema given.`;

    const JSON_SCHEMA = {
      "type": "object",
      "properties": {
        "entries": {
          "type": "array",
          "items": { "$ref": "#/$defs/question_bank_entry" },
          "minItems": 1
        }
      },
      "required": ["entries"],
      "additionalProperties": false,
      "$defs": {
        "question_bank_entry": {
          "type": "object",
          "properties": {
            "number": { "type": "string" },
            "questions": { "type": "string" },
            "options": { "type": "array", "items": { "type": "string" }, "minItems": 4, "maxItems": 6 },
            "answer": { "type": "array", "items": { "type": "integer", "minimum": 0, "maximum": 5 }, "minItems": 1, "maxItems": 3 },
            "answer_explanation": { "type": "string" }
          },
          "required": ["number", "questions", "options", "answer", "answer_explanation"],
          "additionalProperties": false
        }
      }
    };

        // Fetch context from static JSON/Text files if needed
        // const txtUrl = `https://your-domain.com/json/${subject}/${chapter}.txt`;
        // const txtRes = await fetch(txtUrl);
        // ...
        
        // For now, using provided context directly or empty
        const contextText = context || "";
    
    const userPrompt = `Based on the following PDF content, generate 15-30 high-quality quiz questions that strictly adhere to the JSON schema below.${tagsInstruction}\n\nJSON Schema:\n${JSON.stringify(JSON_SCHEMA, null, 2)}\n\nPDF Content:\n${pdfContent}\n\nStrictly follow this example JSON structure...`;

    if (!env.OPENROUTER_API_KEY) return new Response(JSON.stringify({ error: "OpenRouter API key not configured" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    const model = requestedModel || "google/gemini-2.5-flash"; // Use requested or default
    const payload = {
      model: model,
      messages: [
        { role: "system", content: SYSTEM_COMMAND },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    };

    const aiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { 
            "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`, 
            "Content-Type": "application/json",
            "HTTP-Referer": request.url,
            "X-Title": "Quiz Generator Worker"
        },
        body: JSON.stringify(payload)
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return new Response(JSON.stringify({ error: `OpenRouter API Error: ${aiResponse.status}`, details: errorText }), { status: aiResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    
    const result = await aiResponse.json();
    const rawJson = result?.choices?.[0]?.message?.content;
    
    // LOG USAGE
    const userId = getUserId(request);
    if (userId && result.usage) {
        const requestPayload = { system: SYSTEM_COMMAND, user: userPrompt };
        ctx.waitUntil(logUsage(env, userId, model, result.usage, '/generate', requestPayload, rawJson));
    }

    if (!rawJson) return new Response(JSON.stringify({ error: "AI returned empty response" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });

    return new Response(rawJson, { headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
}

async function handleExplanation(request, env, ctx) {
  const requestOrigin = request.headers.get('Origin');
  const corsHeaders = setCorsHeaders(requestOrigin);
  
  const allowedCountries = ['BN', 'KH', 'ID', 'LA', 'MY', 'MM', 'PH', 'SG', 'TH', 'VN'];
  const clientCountry = request.cf.country;
  if (!allowedCountries.includes(clientCountry)) {
    const catImageHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Access Denied</title>
          <style>
              body { margin: 0; padding: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background-color: #000; color: #fff; font-family: sans-serif; }
              img { max-width: 100%; height: auto; }
              h1 { margin-top: 20px; text-align: center; }
          </style>
      </head>
      <body>
          <img src="https://http.cat/404" alt="404 Not Found">
          <h1>We only serve our SEAblings only. Please pay for access.</h1>
      </body>
      </html>
    `;
      return new Response(catImageHtml, { status: 403, headers: { 'Content-Type': 'text/html', ...corsHeaders } });
  }

  try {
      const { prompt, model: requestedModel } = await request.json();
      const openRouterApiKey = env.OPENROUTER_API_KEY; 
      if (!openRouterApiKey) return new Response('OpenRouter API key not configured', { status: 500, headers: corsHeaders });

      const systemMessage = `You are an expert accounting tutor. You will be given a single accounting question and the user's attempted answer... (truncated for brevity). Produce a single, self-contained answer. Use British English.`;
      const model = requestedModel || 'google/gemini-2.5-flash';

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openRouterApiKey}`, 
              'HTTP-Referer': request.url, 
              'X-Title': 'Accounting Tutor Worker' 
          },
          body: JSON.stringify({
              model: model, 
              messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: prompt }]
          })
      });

      if (!response.ok) {
          const errorText = await response.text();
          return new Response(errorText, { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const data = await response.json();
      const explanation = data.choices[0]?.message?.content || 'No explanation found.';
      
      // LOG USAGE
      const userId = getUserId(request);
      if (userId && data.usage) {
          const requestPayload = { system: systemMessage, user: prompt };
          ctx.waitUntil(logUsage(env, userId, model, data.usage, '/explain', requestPayload, explanation));
      }

      return new Response(explanation, { status: 200, headers: { 'Content-Type': 'text/plain', ...corsHeaders } });

  } catch (error) {
      return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        if (request.method === 'OPTIONS') return handleOptions(request);

        // if (url.pathname === '/generate' && request.method === 'POST') {
        //     return handleQuizGeneration(request, env, ctx);
        // }
        if (url.pathname === '/explain' && request.method === 'POST') {
            return handleExplanation(request, env, ctx);
        }

        return new Response('GenAI Worker: Use /generate or /explain', { status: 200, headers: setCorsHeaders(request.headers.get('Origin')) });
    }
};