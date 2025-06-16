export async function onRequestPost(context) {
  const AI = context.env.AI;
  const modelName = "@cf/lykon/dreamshaper-8-lcm";

  try {
    const { prompt } = await context.request.json();
    console.log("Received prompt:", prompt);

    // Run the model
    const result = await AI.run(modelName, { prompt });
    console.log("AI result type:", typeof result);
    console.log("AI result constructor:", result.constructor.name);
    console.log("AI result has arrayBuffer method:", typeof result.arrayBuffer === 'function');

    let buffer;
    
    // Handle different possible response formats from Cloudflare Workers AI
    if (result instanceof ArrayBuffer) {
      // Direct ArrayBuffer
      buffer = new Uint8Array(result);
      console.log("Result is ArrayBuffer, length:", buffer.length);
    } else if (result instanceof Uint8Array) {
      // Already a Uint8Array
      buffer = result;
      console.log("Result is Uint8Array, length:", buffer.length);
    } else if (typeof result.arrayBuffer === 'function') {
      // Response-like object with arrayBuffer method
      const arrayBuffer = await result.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
      console.log("Result has arrayBuffer method, buffer length:", buffer.length);
    } else if (result.image) {
      // Some APIs return { image: ArrayBuffer/Uint8Array }
      if (result.image instanceof ArrayBuffer) {
        buffer = new Uint8Array(result.image);
      } else if (result.image instanceof Uint8Array) {
        buffer = result.image;
      } else {
        throw new Error("Unexpected image format in result.image");
      }
      console.log("Result has image property, buffer length:", buffer.length);
    } else {
      // Log the actual structure to help debug
      console.error("Unexpected result format:", {
        type: typeof result,
        constructor: result.constructor.name,
        keys: Object.keys(result),
        result: result
      });
      throw new Error(`Unexpected result format: ${typeof result}`);
    }

    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error("Generated image buffer is empty");
    }

    console.log("Final buffer length:", buffer.length);

    // Convert buffer to base64
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    const base64 = btoa(binary);
    
    console.log("Base64 length:", base64.length);
    console.log("Base64 preview:", base64.substring(0, 50) + "...");

    // Validate base64
    if (!base64 || base64.length === 0) {
      throw new Error("Base64 conversion failed - empty result");
    }

    return new Response(JSON.stringify({ 
      result: { 
        image_base64: base64,
        buffer_length: buffer.length,
        base64_length: base64.length
      } 
    }), {
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
      { 
        headers: { "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
}
