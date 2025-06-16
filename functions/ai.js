// functions/ai.js
// This file will handle requests to /ai/* paths in your Pages project

export async function onRequestPost(context) {
  // context.env provides access to Pages project environment variables and bindings.
  // The 'AI' binding (which we configured in Pages settings) is available here.
  const AI = context.env.AI;
  const modelName = "@cf/stabilityai/stable-diffusion-xl-lightning"; // Specify the model here

  try {
    // Attempt to parse the request body as JSON.
    // The frontend (script.js) sends the prompt in this format.
    const { prompt } = await context.request.json();

    if (!prompt) {
      // If no prompt is provided, return a 400 Bad Request error.
      return new Response(JSON.stringify({ error: "Prompt is required." }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Call the Cloudflare Workers AI model using the AI binding.
    // The .run() method takes the model name and the inputs for the model.
    const inputs = { prompt: prompt };
    const aiResponse = await AI.run(modelName, inputs); // AI.run returns the model's output directly

    // Cloudflare Workers AI image generation models return an object with image_base64.
    // Example: { image_base64: "..." }
    if (aiResponse && aiResponse.image_base64) {
      // Return the base64 image data in a JSON object that the frontend expects.
      // We wrap it in a 'result' object to match the previous structure from external APIs,
      // making it compatible with the frontend's image display logic.
      return new Response(JSON.stringify({ result: { image_base64: aiResponse.image_base64 } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      // Log an unexpected response from the AI model itself.
      console.error("Unexpected AI model response structure:", aiResponse);
      return new Response(JSON.stringify({ error: "Unexpected AI model response structure from AI model." }), { // More specific error
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }

  } catch (error) {
    // Catch any errors during request parsing or AI model execution.
    console.error("Error in Pages Function (functions/ai.js):", error);
    return new Response(JSON.stringify({ error: `Failed to generate image via AI Function: ${error.message}` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
