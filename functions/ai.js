// functions/ai.js
// This file will handle requests to /ai/* paths in your Pages project
// It exposes a Pages Function that can directly access the Workers AI binding.

// This function will be triggered by POST requests to /ai
export async function onRequestPost(context) {
  // context.env provides access to Pages project environment variables and bindings.
  // The 'AI' binding (which we configured in Pages settings) is available here.
  const AI = context.env.AI;
  // Using a stable, generally available text-to-image model
  const modelName = "@cf/stabilityai/stable-diffusion-v1-5"; 

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

    // AI.run for image models returns a ReadableStream.
    // We need to read this stream into an ArrayBuffer.
    const aiResponseStream = await AI.run(modelName, inputs);

    // Check if the response is indeed a ReadableStream
    if (!(aiResponseStream instanceof ReadableStream)) {
        console.error("Pages Function: AI.run did not return a ReadableStream as expected:", aiResponseStream);
        return new Response(JSON.stringify({ error: "AI model returned unexpected response type (not a stream)." }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }

    // Read the ReadableStream into an ArrayBuffer
    const arrayBuffer = await new Response(aiResponseStream).arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);


    console.log("Pages Function: Successfully received ArrayBuffer from AI model. Buffer length:", buffer.length);

    if (buffer.length === 0) {
      throw new Error("Generated image buffer is empty after AI.run call.");
    }

    // Convert buffer to base64
    const binary = Array.from(buffer).map((b) => String.fromCharCode(b)).join("");
    const base64 = btoa(binary);

    console.log("Pages Function: Base64 length:", base64.length);
    console.log("Pages Function: Base64 preview:", base64.substring(0, 50) + "...");

    // Return the base64 image data in a JSON object that the frontend expects.
    // We wrap it in a 'result' object to match the previous structure from external APIs,
    // making it compatible with the frontend's image display logic.
    return new Response(JSON.stringify({ result: { image_base64: base64 } }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    // Catch any errors during request parsing or AI model execution.
    // Ensure error.message exists
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';

    console.error("Pages Function: Error caught in onRequestPost:", errorName, errorMessage, errorStack);
    // *** IMPORTANT: The '5007: No such model' error originates directly from Cloudflare Workers AI. ***
    // This typically means the specific model is not available to your account or in your region,
    // or requires an explicit opt-in. This is a platform-level issue, not a code bug.
    return new Response(JSON.stringify({
      error: `Pages Function internal error: ${errorMessage}`,
      details: errorStack
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
