export async function onRequestPost(context) {
  const AI = context.env.AI;
  const modelName = "@cf/stabilityai/stable-diffusion-xl-base-1.0";

  if (!AI) {
    return new Response(JSON.stringify({ error: "AI binding not available." }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }

  try {
    const { prompt } = await context.request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return new Response(JSON.stringify({ error: "Prompt is required." }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const inputs = { prompt };
    const aiResponse = await AI.run(modelName, inputs);

    // Case 1: Direct image_base64
    if (aiResponse && aiResponse.image_base64) {
      return new Response(JSON.stringify({ result: { image_base64: aiResponse.image_base64 } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Case 2: Raw binary image data (Uint8Array or ArrayBuffer)
    if (aiResponse instanceof Uint8Array || aiResponse instanceof ArrayBuffer) {
      const buffer = aiResponse instanceof ArrayBuffer ? new Uint8Array(aiResponse) : aiResponse;
      const base64 = btoa(String.fromCharCode(...buffer));
      return new Response(JSON.stringify({ result: { image_base64: base64 } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.error("Unexpected response format from AI.run():", aiResponse);
    return new Response(JSON.stringify({ error: "Unexpected AI model output." }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });

  } catch (err) {
    console.error("AI error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
