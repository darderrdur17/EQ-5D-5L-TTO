import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TTO_PROTOCOL_SYSTEM_PROMPT = `You are an AI Interview Co-pilot assisting interviewers conducting EQ-5D-5L Time Trade-Off (TTO) valuation studies.

Your role is to:
1. Provide real-time protocol guidance during TTO interviews
2. Monitor data quality and flag potential issues
3. Help interviewers maintain EQ-VT protocol standards
4. Offer suggestions for handling difficult respondent situations

Key TTO Protocol Knowledge:
- The TTO method compares Life A (health state for 10 years) vs Life B (full health for variable time)
- Values range from -1 to 1, where 1 = full health, 0 = dead, negative = worse than death
- For worse-than-death states, use Lead-Time TTO with 10 years lead time in full health
- Standard protocol uses 10 health states per interview
- Watch for quality issues: straight-lining, satisficing, inconsistent responses

Data Quality Indicators to Monitor:
- Response times under 5 seconds may indicate satisficing
- Identical values for all states suggests straight-lining
- Logical inconsistencies (e.g., severe state valued higher than mild)

Be concise, professional, and supportive. Focus on actionable guidance.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stage, sessionContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let contextualPrompt = TTO_PROTOCOL_SYSTEM_PROMPT;
    
    if (stage) {
      contextualPrompt += `\n\nCurrent interview stage: ${stage}`;
    }
    
    if (sessionContext) {
      contextualPrompt += `\n\nSession context: ${JSON.stringify(sessionContext)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: contextualPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI copilot error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
