// --- Global DOM Element Variables (will be assigned in DOMContentLoaded) ---
let promptInput = null;
let generateBtn = null;
let textOutputDiv = null;
let textPlaceholder = null;
let uiverseLoader = null; // Correctly referencing the Uiverse SVG container
let generatedTextContent = null; // Div for actual text output
let themeToggleBtn = null;

// --- Variable to hold the interval ID for loading phrases ---
let loadingTextIntervalId = null;

// --- Array of loading phrases for the button ---
const loadingPhrases = [
    "Thinking...",
    "Generating...",
    "Processing...",
    "Analyzing input...",
    "Crafting response...",
    "Fetching wisdom...",
    "Almost there...",
    "Consulting neural networks...",
    "Deep learning in progress...",
    "Synthesizing data...",
    "Formulating ideas...",
    "Composing thoughts...",
    "Crunching numbers...",
    "Accessing knowledge base...",
    "Unpacking complexities...",
    "Connecting the dots...",
    "Building understanding...",
    "Refining output...",
    "Optimizing response...",
    "Evaluating possibilities...",
    "Predicting outcomes...",
    "Simulating scenarios...",
    "Engaging cognitive modules...",
    "Warming up circuits...",
    "Awakening algorithms...",
    "Interpreting patterns...",
    "Constructing narrative...",
    "Loading linguistic models...",
    "Exploring datasets...",
    "Just a moment...",
    "Putting pieces together...",
    "One second please...",
    "Making connections...",
    "Articulating insights...",
    "Preparing the answer...",
    "Enhancing clarity...",
    "Filtering noise...",
    "Aligning parameters...",
    "Running simulations...",
    "Checking for coherence...",
    "Finalizing draft...",
    "Polishing response...",
    "Applying creativity...",
    "Considering alternatives...",
    "Fact-checking...",
    "Verifying information...",
    "Nearly done...",
    "Getting smarter...",
    "Applying context...",
    "Cross-referencing...",
    "Initializing thought processes...",
    "Building bridges of knowledge...",
    "Deciphering nuances...",
    "Loading virtual libraries...",
    "Tuning in to frequencies of data...",
    "Brewing brilliance...",
    "Awaiting inspiration...",
    "Just a blink away...",
    "Assembling the truth...",
    "Summoning intelligence...",
    "Embarking on a data journey...",
    "Preparing your personalized insight...",
    "Weaving words, byte by byte...",
    "Igniting innovation..."
];

/**
 * Gets a random loading phrase from the defined array.
 * @returns {string} A random loading phrase.
 */
function getRandomLoadingPhrase() {
    const randomIndex = Math.floor(Math.random() * loadingPhrases.length);
    return loadingPhrases[randomIndex];
}

/**
 * Formats AI-generated text by replacing `**text**` with `<strong>text</strong>`.
 * This bolds the text and removes the double asterisks.
 *
 * @param {string} inputText The raw text string from the AI.
 * @returns {string} The formatted text with bolding applied.
 */
function formatAiText(inputText) {
    // Use a regular expression to find all occurrences of **text**
    // The `g` flag ensures all matches are found, not just the first.
    // The `*?` makes the match non-greedy, so it stops at the first `**`.
    // The content inside the parentheses `(.*?)` is captured as a group.
    const formattedText = inputText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return formattedText;
}

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
    if (generatedTextContent) generatedTextContent.textContent = '';
    if (textPlaceholder) textPlaceholder.style.display = 'none';
    if (uiverseLoader) uiverseLoader.style.display = 'block'; // Correctly use uiverseLoader

    if (generateBtn) {
        generateBtn.disabled = true;
        // Start cycling through loading phrases
        generateBtn.textContent = getRandomLoadingPhrase(); // Set initial phrase immediately
        loadingTextIntervalId = setInterval(() => {
            generateBtn.textContent = getRandomLoadingPhrase();
        }, 2000); // Change phrase every 2 seconds
    } else {
        console.error("Generate button (generateBtn) is null in generateText function.");
        showMessage("Application error: Generate button not found.", "error");
        return;
    }

    const apiUrl = `/generate-text`;
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
        
        console.log('Full response from Pages Function:', result);

        if (result && result.response && typeof result.response === 'string') {
            if (generatedTextContent) {
                // *** THIS IS THE CRITICAL CHANGE ***
                // Apply the formatting function to the AI's raw response
                const rawAiText = result.response;
                const formattedHtmlText = formatAiText(rawAiText);
                // Set the innerHTML of the content div to render the bold tags
                generatedTextContent.innerHTML = formattedHtmlText;
            }
            showMessage('Text generated successfully!', 'success');
        } else {
            console.error('Unexpected response structure from Pages Function:', result);
            showMessage('Could not generate text. Unexpected response format from AI.', 'error');
        }
    } catch (error) {
        console.error('Error calling Pages Function:', error);
        showMessage(`Error: ${error.message}`, 'error');
    } finally {
        // Clear the interval when generation is complete (or fails)
        if (loadingTextIntervalId) {
            clearInterval(loadingTextIntervalId);
            loadingTextIntervalId = null; // Reset the ID
        }

        if (uiverseLoader) uiverseLoader.style.display = 'none'; // Correctly use uiverseLoader
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Text'; // Reset button text
        }
        if (generatedTextContent && !generatedTextContent.textContent.trim()) {
            if (textPlaceholder) textPlaceholder.style.display = 'block';
        }
    }
}

// --- Theme Toggle Logic ---

/**
 * Sets the theme based on user preference or system setting.
 * @param {string} theme - 'light' or 'dark'.
 */
function setTheme(theme) {
    try {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            if (themeToggleBtn) {
                themeToggleBtn.textContent = '🌙';
            }
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            if (themeToggleBtn) {
                themeToggleBtn.textContent = '☀️';
            }
        }
    } catch (e) {
        console.error("Error accessing localStorage for theme toggle:", e);
    }
}

/**
 * Toggles the theme between light and dark.
 */
function toggleTheme() {
    try {
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

/**
 * Initializes the theme based on saved preference or system setting.
 */
function initializeTheme() {
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    } catch (e) {
        console.error("Error initializing theme due to localStorage access:", e);
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
    uiverseLoader = document.getElementById('uiverseLoader'); // Correctly target uiverseLoader
    generatedTextContent = document.getElementById('generatedTextContent');
    themeToggleBtn = document.getElementById('themeToggle');

    // Add event listeners AFTER elements are assigned and checked for existence
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
            if (event.key === 'Enter' && event.shiftKey) { // Shift+Enter for new line
                // Allow default new line behavior for Shift+Enter
            } else if (event.key === 'Enter') { // Only Enter to generate
                event.preventDefault(); // Prevent default Enter (new line)
                if (generateBtn) generateBtn.click(); // Trigger button click
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

    // Initialize theme after all related elements are assigned
    initializeTheme(); 
});
