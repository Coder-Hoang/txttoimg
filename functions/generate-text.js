// functions/generate-text.js
// This Pages Function handles requests for text generation using a Cloudflare Workers AI LLM.

export async function onRequestPost(context) {
  const AI = context.env.AI; // The AI binding automatically available to Pages Functions
  const modelName = "@cf/meta/llama-2-7b-chat-int8"; // A stable LLM model from Cloudflare Workers AI

  // Ensure the AI binding is available
  if (!AI) {
    console.error("Pages Function: Cloudflare AI binding (env.AI) is not available. Check Pages settings for 'AI' binding.");
    return new Response(JSON.stringify({ error: "AI service not configured correctly. Missing 'AI' binding." }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }

  try {
    const requestBody = await context.request.json();
    const prompt = requestBody.prompt;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      console.warn("Pages Function: Invalid or empty prompt received.");
      return new Response(JSON.stringify({ error: "Invalid or empty prompt provided." }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Inputs for the LLM model
    const inputs = {
      messages: [{ role: "user", content: prompt }]
    };

    console.log(`Pages Function: Calling AI.run for model: ${modelName} with prompt: "${prompt.substring(0, Math.min(prompt.length, 50))}..."`);

    // Call the Workers AI LLM
    const aiResponse = await AI.run(modelName, inputs);

    // LLM models usually return an object with a 'response' string property
    if (aiResponse && typeof aiResponse === 'object' && aiResponse.response && typeof aiResponse.response === 'string') {
      console.log("Pages Function: Successfully received text response from AI model.");
      return new Response(JSON.stringify({ response: aiResponse.response }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      console.error("Pages Function: Unexpected AI model response structure or missing 'response' property:", aiResponse);
      return new Response(JSON.stringify({ error: "AI model returned an unexpected response format." }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';

    console.error("Pages Function: Error caught in onRequestPost:", errorName, errorMessage, errorStack);
    // Return a structured JSON error response to the frontend
    return new Response(JSON.stringify({
      error: `Pages Function internal error: ${errorMessage}`,
      details: errorStack
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
