// --- Global DOM Element Variables (will be assigned in DOMContentLoaded) ---
// Declared with 'let' and initialized to null, then assigned inside DOMContentLoaded
let promptInput = null;
let generateBtn = null;
let textOutputDiv = null;
let textPlaceholder = null;
let uiverseLoader = null; // Correctly referencing the Uiverse SVG container
let generatedTextContent = null; // Div for actual text output
let themeToggleBtn = null;

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


// --- Text Generation Logic ---

/**
 * Generates text using a Cloudflare Workers AI LLM via a Pages Function proxy.
 * @param {string} prompt - The text prompt for the LLM.
 */
async function generateText(prompt) {
    // Clear previous text, hide placeholder, show loading indicator
    // Ensure these elements are not null before trying to access their properties
    if (generatedTextContent) generatedTextContent.textContent = ''; // Clear existing text content
    if (textPlaceholder) textPlaceholder.style.display = 'none'; // Hide the placeholder text
    if (uiverseLoader) uiverseLoader.style.display = 'block'; // Show the Uiverse SVG loader
    if (generateBtn) {
        generateBtn.disabled = true; // Disable button during generation
        generateBtn.textContent = 'Generating...'; // Keep button text as Generating...
    } else {
        console.error("Generate button (generateBtn) is null in generateText function.");
        showMessage("Application error: Generate button not found.", "error");
        return; // Exit if critical element is missing
    }


    // Call our Pages Function at the /generate-text path.
    const apiUrl = `/generate-text`;

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
                errorMessage += errorData.error || errorData.message || 'Unknown error from JSON';
            } catch (jsonError) {
                console.error("Failed to parse error response as JSON:", jsonError, "Raw text:", errorText);
                errorMessage += `Non-JSON response from server: ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
            }
            
            console.error('API Error Response:', response.status, response.statusText, errorData);
            throw new Error(`Text generation failed: ${errorMessage}`);
        }

        const result = await response.json();
        
        // Debug logging to see what we're actually getting
        console.log('Full response from Pages Function:', result);

        // Cloudflare Workers AI LLM responses typically have 'response' property
        if (result && result.response && typeof result.response === 'string') {
            if (generatedTextContent) generatedTextContent.textContent = result.response; // Display the AI's response in the new div
            showMessage('Text generated successfully!', 'success');
        } else {
            console.error('Unexpected response structure from Pages Function:', result);
            showMessage('Could not generate text. Unexpected response format from AI.', 'error');
        }
    } catch (error) {
        console.error('Error calling Pages Function:', error);
        showMessage(`Error: ${error.message}`, 'error');
    } finally {
        if (uiverseLoader) uiverseLoader.style.display = 'none'; // Hide Uiverse loader
        if (generateBtn) {
            generateBtn.disabled = false; // Re-enable button
            generateBtn.textContent = 'Generate Text';
        }
        // Show placeholder if no text was successfully displayed
        if (generatedTextContent && !generatedTextContent.textContent.trim()) {
            if (textPlaceholder) textPlaceholder.style.display = 'block'; // Show placeholder if content is empty
        }
    }
}

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

// --- Initialize Application on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Text Generator App: DOM Content Loaded. Initializing app.");

    // Assign DOM elements AFTER the DOM is loaded
    promptInput = document.getElementById('promptInput');
    generateBtn = document.getElementById('generateBtn');
    textOutputDiv = document.getElementById('textOutput');
    textPlaceholder = document.getElementById('textPlaceholder');
    uiverseLoader = document.getElementById('uiverseLoader'); // Correctly retrieve the Uiverse SVG container
    generatedTextContent = document.getElementById('generatedTextContent');
    themeToggleBtn = document.getElementById('themeToggle');

    // Add event listeners AFTER elements are assigned
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const prompt = promptInput.value.trim();
            if (prompt) {
                generateText(prompt);
            } else {
                showMessage('Please enter a prompt for the AI.', 'info');
            }
        });
    } else {
        console.error("Generate button with ID 'generateBtn' not found in HTML.");
    }

    if (promptInput) {
        promptInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) { // Shift+Enter for new line
                event.preventDefault(); // Prevent new line
                if (generateBtn) generateBtn.click(); // Trigger button click, ensure generateBtn is not null
            }
        });
    } else {
        console.error("Prompt input with ID 'promptInput' not found in HTML.");
    }
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    } else {
        console.error("Theme toggle button with ID 'themeToggle' not found in HTML.");
    }

    initializeTheme(); // Set up the theme now that themeToggleBtn is assigned
});
