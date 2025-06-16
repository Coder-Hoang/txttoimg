export async function onRequestPost(context) {
  const AI = context.env.AI;
  const modelName = "@cf/stabilityai/stable-diffusion-xl-base-1.0";

  if (!AI) {
    return new Response(JSON.stringify({ error: "AI service not configured." }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }

  try {
    const requestBody = await context.request.json();
    const prompt = requestBody.prompt;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return new Response(JSON.stringify({ error: "Invalid or empty prompt provided." }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const inputs = { prompt: prompt };
    const aiResponse = await AI.run(modelName, inputs);

    console.log("AI response:", aiResponse);

    // Sometimes Cloudflare may return raw bytes instead of base64 — check here
    if (aiResponse && typeof aiResponse === 'object' && aiResponse.image_base64) {
      return new Response(JSON.stringify({ result: { image_base64: aiResponse.image_base64 } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      console.error("Unexpected AI response:", aiResponse);
      return new Response(JSON.stringify({
        error: "AI model returned an unexpected response format or no image data.",
        raw: aiResponse
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: `Internal error: ${message}` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
