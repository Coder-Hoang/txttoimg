export async function onRequestPost(context) {
  const AI = context.env.AI;
  const modelName = "@cf/lykon/dreamshaper-8-lcm";

  try {
    const { prompt } = await context.request.json();

    console.log("Generating image with prompt:", prompt);

    // Run the model
    const result = await AI.run(modelName, { prompt });
    
    console.log("AI result type:", typeof result);
    console.log("AI result:", result);
    console.log("AI result constructor:", result?.constructor?.name);

    let buffer;
    
    // Handle different possible response formats from Cloudflare AI
    if (result instanceof ArrayBuffer) {
      // If it's already an ArrayBuffer
      buffer = new Uint8Array(result);
    } else if (result && typeof result.arrayBuffer === 'function') {
      // If it has an arrayBuffer method (like Response objects)
      buffer = new Uint8Array(await result.arrayBuffer());
    } else if (result instanceof Uint8Array) {
      // If it's already a Uint8Array
      buffer = result;
    } else if (Array.isArray(result)) {
      // If it's a regular array
      buffer = new Uint8Array(result);
    } else if (result && result.data) {
      // Some AI models return { data: ArrayBuffer } or similar
      if (result.data instanceof ArrayBuffer) {
        buffer = new Uint8Array(result.data);
      } else if (result.data instanceof Uint8Array) {
        buffer = result.data;
      } else if (Array.isArray(result.data)) {
        buffer = new Uint8Array(result.data);
      } else {
        throw new Error(`Unexpected result.data format: ${typeof result.data}, constructor: ${result.data?.constructor?.name}`);
      }
    } else {
      // Log more details about what we actually got
      console.error("Unexpected result format details:");
      console.error("Type:", typeof result);
      console.error("Constructor:", result?.constructor?.name);
      console.error("Keys:", result ? Object.keys(result) : "null/undefined");
      console.error("Is ArrayBuffer:", result instanceof ArrayBuffer);
      console.error("Is Uint8Array:", result instanceof Uint8Array);
      console.error("Has arrayBuffer method:", result && typeof result.arrayBuffer === 'function');
      
      throw new Error(`Unexpected result format: ${typeof result}, constructor: ${result?.constructor?.name}`);
    }

    console.log("Buffer length:", buffer.length);

    if (buffer.length === 0) {
      throw new Error("Generated image buffer is empty");
    }

    // Convert buffer to base64
    const binary = Array.from(buffer).map((b) => String.fromCharCode(b)).join("");
    const base64 = btoa(binary);

    console.log("Base64 length:", base64.length);
    console.log("Base64 preview:", base64.substring(0, 50) + "...");

    return new Response(JSON.stringify({ result: { image_base64: base64 } }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function Error:", err);
    console.error("Error stack:", err.stack);
    
    return new Response(
      JSON.stringify({ 
        error: err.message || "Unknown error",
        stack: err.stack
      }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
}
