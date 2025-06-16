export async function onRequestPost(context) {
  const AI = context.env.AI;
  const modelName = "@cf/stabilityai/stable-diffusion-xl-base-1.0"; // Use a working model

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
    const result = await AI.run(modelName, inputs);

    let buffer;

    if (result instanceof ArrayBuffer) {
      buffer = new Uint8Array(result);
    } else if (result instanceof Uint8Array) {
      buffer = result;
    } else if (result && result.arrayBuffer instanceof Function) {
      // If result is a Response-like object
      buffer = new Uint8Array(await result.arrayBuffer());
    } else {
      console.error("Unexpected AI model output:", result);
      return new Response(JSON.stringify({ error: "Unexpected AI model output." }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Convert buffer to base64
    const binary = Array.from(buffer).map(b => String.fromCharCode(b)).join('');
    const base64 = btoa(binary);

    return new Response(JSON.stringify({ result: { image_base64: base64 } }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (err) {
    console.error("AI Function Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
