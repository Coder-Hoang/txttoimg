// functions/ai.js
// This file will handle requests to /ai/* paths in your Pages project

export async function onRequestPost(context) {
  // Pages Functions automatically expose bindings in context.env
  const AI = context.env.AI; // This is the AI binding automatically available to Pages Functions
  const modelName = "@cf/stabilityai/stable-diffusion-xl-lightning";

  try {
    // Read the prompt from the incoming request body
    const { prompt } = await context.request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required." }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Call the Workers AI model
    const inputs = { prompt: prompt };
    const response = await AI.run(modelName, inputs); // Using AI.run directly

    // Workers AI image generation returns an object with image_base64
    if (response && response.image_base64) {
      return new Response(JSON.stringify({ result: { image_base64: response.image_base64 } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      console.error("Unexpected AI response structure:", response);
      return new Response(JSON.stringify({ error: "Unexpected AI response structure." }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }

  } catch (error) {
    console.error("Error in Pages Function:", error);
    return new Response(JSON.stringify({ error: `Failed to generate image: ${error.message}` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}