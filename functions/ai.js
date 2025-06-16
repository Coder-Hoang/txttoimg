// functions/ai.js
// This file will handle requests to /ai/* paths in your Pages project
// It exposes a Pages Function that can directly access the Workers AI binding.

// This function will be triggered by POST requests to /ai
export async function onRequestPost(context) {
  // context.env provides access to Pages project environment variables and bindings.
  // The 'AI' binding (which we configured in Pages settings) is available here.
  const AI = context.env.AI;
  const modelName = "@cf/stabilityai/stable-diffusion-xl-lightning"; // Specify the model here

  // Ensure the AI binding is available
  if (!AI) {
    console.error("Cloudflare AI binding (env.AI) is not available in Pages Function. Check Pages settings for 'AI' binding.");
    return new Response(JSON.stringify({ error: "AI service not configured correctly. Missing 'AI' binding." }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }

  try {
    // Attempt to parse the request body as JSON.
    // The frontend (script.js) sends the prompt in this format.
    const requestBody = await context.request.json();
    const prompt = requestBody.prompt; // Extract the prompt

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      // If no valid prompt is provided, return a 400 Bad Request error.
      console.warn("Invalid or empty prompt received in Pages Function.");
      return new Response(JSON.stringify({ error: "Invalid or empty prompt provided." }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Call the Cloudflare Workers AI model using the AI binding.
    // The .run() method takes the model name and the inputs for the model.
    const inputs = { prompt: prompt };
    console.log(`Pages Function: Calling AI.run for model: ${modelName} with prompt: "${prompt.substring(0, Math.min(prompt.length, 50))}..."`);
    const aiResponse = await AI.run(modelName, inputs); // AI.run returns the model's output directly

    // Cloudflare Workers AI image generation models return an object with image_base64.
    // Example: { image_base64: "..." }
    if (aiResponse && typeof aiResponse === 'object' && aiResponse.image_base64) {
      // Return the base64 image data in a JSON object that the frontend expects.
      // We wrap it in a 'result' object to match the previous structure from external APIs,
      // making it compatible with the frontend's image display logic.
      console.log("Pages Function: Successfully received image_base64 from AI model.");
      return new Response(JSON.stringify({ result: { image_base64: aiResponse.image_base64 } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      // Log an unexpected response from the AI model itself.
      console.error("Pages Function: Unexpected AI model response structure or missing image_base64.", aiResponse);
      return new Response(JSON.stringify({ error: "AI model returned an unexpected response format or no image data." }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }

  } catch (error) {
    // Catch any errors during request parsing or AI model execution.
    // Ensure error.message exists
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
