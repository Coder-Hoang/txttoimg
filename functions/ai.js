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

    // Detect raw binary response (ArrayBuffer or Uint8Array)
    const buffer = aiResponse instanceof ArrayBuffer
      ? new Uint8Array(aiResponse)
      : (aiResponse instanceof Uint8Array ? aiResponse : null);

    if (buffer) {
      // Convert binary to base64
      let binary = '';
      for (let i = 0; i < buffer.length; i++) {
        binary += String.fromCharCode(buffer[i]);
      }
      const base64 = btoa(binary);
      return new Response(JSON.stringify({ result: { image_base64: base64 } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.error("Unexpected AI model output:", aiResponse);
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
