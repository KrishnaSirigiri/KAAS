const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");
const generateBtn = document.querySelector(".generate-btn");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");

const API_KEY = "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"; // Your API key

const promptExamples = [
    "A magic forest with glowing plants and fairy homes among giant mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars colony with glass domes and gardens against red mountains",
    "A dragon sleeping on gold coins in a crystal cave",
    "An underwater kingdom with merpeople and glowing coral buildings",
    "A floating island with waterfalls pouring into clouds below",
    "A witch's cottage in fall with magic herbs in the garden",
    "A robot painting in a sunny studio with art supplies around it",
    "A magical library with floating glowing books and spiral staircases",
    "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
    "A cosmic beach with glowing sand and an aurora in the night sky",
    "A medieval marketplace with colorful tents and street performers",
    "A cyberpunk city with neon signs and flying cars at night",
    "A peaceful bamboo forest with a hidden ancient temple",
    "A giant turtle carrying a village on its back in the ocean",
];

// Initialize theme based on saved preference or system
(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

// Theme toggle handler
themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
});

// Get image dimensions based on aspect ratio, ensuring multiples of 16
function getImageDimensions(aspectRatio, baseSize = 512) {
    const [widthRatio, heightRatio] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(widthRatio * heightRatio);
    let width = Math.floor((widthRatio * scaleFactor) / 16) * 16;
    let height = Math.floor((heightRatio * scaleFactor) / 16) * 16;
    return { width, height };
}

// Update image card after generation
function updateImageCard(index, imageURL) {
    const card = document.getElementById(`img-card-${index}`);
    if (!card) return;
    card.classList.remove("loading");
    card.innerHTML = `
        <img src="${imageURL}" alt="Generated Image" class="result-img" />
        <div class="img-overlay">
            <a href="${imageURL}" class="img-download-btn" download="generated-${Date.now()}.png" title="Download Image">
                <i class="fa-solid fa-download"></i>
            </a>
        </div>`;
}

// Create placeholder image cards with loading spinner
function createImageCards(count) {
    gridGallery.innerHTML = "";
    for (let i = 0; i < count; i++) {
        gridGallery.innerHTML += `
            <div class="img-card loading" id="img-card-${i}">
                <div class="status-container">
                    <div class="spinner"></div>
                    <p class="status-text">Generating...</p>
                </div>
            </div>
        `;
    }
}

// Generate images using Hugging Face API
async function generateImages(model, count, ratio, prompt) {
    const MODEL_URL = `https://router.huggingface.co/hf-inference/models/${model}`;
    const { width, height } = getImageDimensions(ratio);

    generateBtn.disabled = true;

    createImageCards(count);

    const generationPromises = Array.from({ length: count }, async (_, i) => {
        try {
            const response = await fetch(MODEL_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false",
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: { width, height },
                    options: { wait_for_model: true, user_cache: false },
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Unknown error");
            }

            const blob = await response.blob();
            const imageURL = URL.createObjectURL(blob);
            updateImageCard(i, imageURL);
        } catch (error) {
            console.error(error);
            const card = document.getElementById(`img-card-${i}`);
            if (card) {
                card.classList.replace("loading", "error");
                card.querySelector(".status-text").textContent = "Generation failed!";
            }
        }
    });

    await Promise.allSettled(generationPromises);
    generateBtn.disabled = false;
}

// Handle form submission
promptForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const prompt = promptInput.value.trim();
    const model = modelSelect.value;
    const count = Number(countSelect.value);
    const ratio = ratioSelect.value;

    if (!prompt || !model || !count || !ratio) {
        alert("Please fill in all fields.");
        return;
    }

    generateImages(model, count, ratio, prompt);
});

// Random prompt button click: replace prompt with a random example
promptBtn.addEventListener("click", () => {
    const randomPrompt = promptExamples[Math.floor(Math.random() * promptExamples.length)];
    promptInput.value = randomPrompt;
    promptInput.focus();
});
