export async function onRequestPost(context) {
  const AI = context.env.AI;
  const modelName = "@cf/stabilityai/stable-diffusion-xl-base-1.0";

  try {
    const { prompt } = await context.request.json();
    const inputs = { prompt };

    const result = await AI.run(modelName, inputs);

    // ⛏️ Debug log (just for testing)
    console.log("AI Result Type:", typeof result);
    console.log("AI Result instanceof Response:", result instanceof Response);
    console.log("AI Result keys:", Object.keys(result || {}));

    let buffer;

    if (result instanceof ArrayBuffer) {
      buffer = new Uint8Array(result);
    } else if (result instanceof Uint8Array) {
      buffer = result;
    } else if (result && result.arrayBuffer instanceof Function) {
      buffer = new Uint8Array(await result.arrayBuffer());
    } else if (result && result.image) {
      // fallback: some models return { image: base64 }
      return new Response(JSON.stringify({ result }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: "Unexpected AI model output", debug: result }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Convert to base64
    const binary = Array.from(buffer).map((b) => String.fromCharCode(b)).join("");
    const base64 = btoa(binary);

    return new Response(JSON.stringify({ result: { image_base64: base64 } }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Function Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
