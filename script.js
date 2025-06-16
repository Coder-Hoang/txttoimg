// --- DOM Elements ---
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const imageOutputDiv = document.getElementById('imageOutput');
const generatedImage = document.getElementById('generatedImage');
const loadingSpinner = document.getElementById('loadingSpinner');
const imagePlaceholder = document.getElementById('imagePlaceholder');
const themeToggleBtn = document.getElementById('themeToggle');

// --- Utility function for showing messages (instead of alert) ---
function showMessage(message, type = 'info') {
    let messageBox = document.getElementById('app-message-box');

    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'app-message-box';
        messageBox.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            z-index: 1001;
            opacity: 0;
            transition: opacity 0.3s ease-in-out, top 0.3s ease-in-out;
            color: white;
            text-align: center;
            min-width: 250px;
        `;
        document.body.appendChild(messageBox);
    }

    messageBox.textContent = message;
    if (type === 'error') {
        messageBox.style.backgroundColor = 'var(--error-color)';
    } else if (type === 'success') {
        messageBox.style.backgroundColor = 'var(--success-color)';
    } else {
        messageBox.style.backgroundColor = 'var(--primary-color)';
    }

    messageBox.style.opacity = 1;
    messageBox.style.top = '20px';

    setTimeout(() => {
        messageBox.style.opacity = 0;
        messageBox.style.top = '-50px';
        setTimeout(() => {
            if (messageBox.parentNode) {
                messageBox.parentNode.removeChild(messageBox);
            }
        }, 300);
    }, 3000);
}


// --- Image Generation Logic ---

/**
 * Generates an image using a Cloudflare Workers AI model via a Pages Function proxy.
 * @param {string} prompt - The text description for the image.
 * @returns {string|null} Base64 encoded image URL or null on failure.
 */
async function generateImage(prompt) {
    // Hide previous image, show spinner, hide placeholder
    generatedImage.style.display = 'none';
    imagePlaceholder.style.display = 'none';
    loadingSpinner.style.display = 'block';
    generateBtn.disabled = true; // Disable button during generation
    generateBtn.textContent = 'Generating...';

    // Now we call our Pages Function directly at the /ai path.
    // The Pages Function (functions/ai.js) will then handle the AI model call.
    const apiUrl = `/ai`;

    // The payload for our Pages Function is just the prompt
    const payload = { prompt: prompt };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData = {};
            let errorMessage = `Server error (Status: ${response.status} ${response.statusText || 'Unknown'}): `;

            try {
                errorData = JSON.parse(errorText);
                // Prefer 'error' property from Pages Function, then 'message', then default
                errorMessage += errorData.error || errorData.message || 'Unknown error from JSON';
            } catch (jsonError) {
                console.error("Failed to parse error response as JSON:", jsonError, "Raw text:", errorText);
                errorMessage += `Non-JSON response from server: ${errorText.substring(0, Math.min(errorText.length, 100))}...`; // Truncate for display
            }
            
            console.error('API Error Response:', response.status, response.statusText, errorData);
            throw new Error(`Image generation failed: ${errorMessage}`);
        }

        const result = await response.json();
        
        // Debug logging to see what we're actually getting
        console.log('Full response from Pages Function:', result);
        console.log('result.result:', result.result);
        if (result.result) {
            console.log('result.result.image_base64 exists:', 'image_base64' in result.result);
            console.log('result.result.image_base64 length:', result.result.image_base64?.length);
            console.log('result.result.image_base64 type:', typeof result.result.image_base64);
        }

        // Cloudflare Workers AI image generation (via Pages Function) returns an object with image_base64.
        // The structure is { result: { image_base64: "..." } }
        // Our Pages Function should ensure this structure is passed back.
        if (result.result && 'image_base64' in result.result && result.result.image_base64) {
            const base64Data = result.result.image_base64;
            
            // Validate that we actually have base64 data
            if (typeof base64Data === 'string' && base64Data.length > 0) {
                const imageUrl = `data:image/png;base64,${base64Data}`;
                generatedImage.src = imageUrl;
                generatedImage.style.display = 'block'; // Show the generated image
                showMessage('Image generated successfully!', 'success');
                return imageUrl;
            } else {
                console.error('image_base64 is empty or not a string:', base64Data);
                showMessage('Generated image data is empty or invalid.', 'error');
                return null;
            }
        } else {
            console.error('Unexpected response structure from Pages Function:', result);
            console.error('Expected: { result: { image_base64: "..." } }');
            
            // More detailed error reporting
            if (!result.result) {
                console.error('Missing result property');
            } else if (!('image_base64' in result.result)) {
                console.error('Missing image_base64 property in result');
                console.error('Available properties in result.result:', Object.keys(result.result));
            } else if (!result.result.image_base64) {
                console.error('image_base64 property exists but is falsy:', result.result.image_base64);
            }
            
            showMessage('Could not generate image. Unexpected response from Pages Function.', 'error');
            return null;
        }
    } catch (error) {
        console.error('Error calling Pages Function:', error);
        showMessage(`Error: ${error.message}`, 'error');
        return null;
    } finally {
        loadingSpinner.style.display = 'none'; // Hide spinner
        generateBtn.disabled = false; // Re-enable button
        generateBtn.textContent = 'Generate Image';
        // Only show placeholder if no image was successfully displayed
        if (!generatedImage.src || generatedImage.style.display === 'none') {
            imagePlaceholder.style.display = 'block';
        }
    }
}

// --- Event Listeners ---

// Event listener for the Generate button
generateBtn.addEventListener('click', () => {
    const prompt = promptInput.value.trim();
    if (prompt) {
        generateImage(prompt);
    } else {
        showMessage('Please enter a description for the image.', 'info');
    }
});

// Allow generating image with Enter key in the textarea
promptInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Shift+Enter for new line
        event.preventDefault(); // Prevent new line
        generateBtn.click(); // Trigger button click
    }
});


// --- Theme Toggle Logic ---

/**
 * Sets the theme based on user preference or system setting.
 * @param {string} theme - 'light' or 'dark'.
 */
function setTheme(theme) {
    try { // Wrap localStorage operations in a try-catch block for robustness
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            if (themeToggleBtn) {
                themeToggleBtn.textContent = '🌙'; // Moon icon for dark mode
            }
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            if (themeToggleBtn) {
                themeToggleBtn.textContent = '☀️'; // Sun icon for light mode
            }
        }
    } catch (e) {
        console.error("Error accessing localStorage for theme toggle:", e);
        // Show a message to the user that theme saving is disabled if it's the first time trying to save
        // We avoid showing this on every page load during initialization
    }
}

/**
 * Toggles the theme between light and dark.
 */
function toggleTheme() {
    try { // Wrap localStorage operations in a try-catch block for robustness
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    } catch (e) {
        console.error("Error accessing localStorage to toggle theme:", e);
        showMessage("Theme toggle disabled: Browser security settings prevent local storage access.", "error");
    }
}

// Event listener for the theme toggle button
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
} else {
    console.error("Theme toggle button with ID 'themeToggle' not found in HTML.");
}

/**
 * Initializes the theme based on saved preference or system setting.
 */
function initializeTheme() {
    try { // Wrap localStorage operations in a try-catch block for robustness
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // Check for system dark mode preference if no theme is saved
            setTheme('dark');
        } else {
            setTheme('light'); // Default to light if no preference
        }
    } catch (e) {
        console.error("Error initializing theme due to localStorage access:", e);
        // No user message here, as it's on page load and might be less critical if functionality is limited
    }
}


// --- Initialize Application on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Text-to-Image App: DOM Content Loaded. Initializing app.");
    initializeTheme(); // Set up the theme first
    // No initial image generation, wait for user prompt
});
