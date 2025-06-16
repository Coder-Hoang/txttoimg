export async function onRequestPost(context) {
  const AI = context.env.AI;
  const modelName = "@cf/stabilityai/stable-diffusion-xl-base-1.0";

  try {
    const { prompt } = await context.request.json();

    // Run the model
    const result = await AI.run(modelName, { prompt });

    // Force it to act like a Response object and extract arrayBuffer
    const buffer = result.arrayBuffer
      ? new Uint8Array(await result.arrayBuffer())
      : new Uint8Array(result); // fallback if already buffer

    // Convert buffer to base64
    const binary = Array.from(buffer).map((b) => String.fromCharCode(b)).join("");
    const base64 = btoa(binary);

    return new Response(JSON.stringify({ result: { image_base64: base64 } }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
}
