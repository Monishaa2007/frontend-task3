// script.js
const apiKey = "YOUR_TMDB_API_KEY"; // Replace with your TMDb API key
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const resultsDiv = document.getElementById("results");
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const currentPageSpan = document.getElementById("currentPage");
const errorMessageDiv = document.getElementById("error-message");

let currentPage = 1;
let totalPages = 1;
let currentQuery = "";
let cache = {};

async function searchMovies(query, page) {
    if (cache[`${query}-${page}`]) {
        displayResults(cache[`${query}-${page}`]);
        return;
    }

    const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        cache[`${query}-${page}`] = data;
        displayResults(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        displayError("An error occurred while fetching data. Please try again later.");
        handleRateLimit(query, page);
    }
}

function displayResults(data) {
    resultsDiv.innerHTML = "";
    if (data.results && data.results.length > 0) {
        data.results.forEach(item => {
            const resultItem = document.createElement("div");
            resultItem.classList.add("result-item");
            const imageUrl = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : item.profile_path ? `https://image.tmdb.org/t/p/w200${item.profile_path}` : "placeholder.jpg";
            const title = item.title || item.name;
            resultItem.innerHTML = `
                <img src="${imageUrl}" alt="${title}">
                <h3>${title}</h3>
                <p>${item.media_type}</p>
            `;
            resultsDiv.appendChild(resultItem);
        });
        totalPages = data.total_pages;
        updatePagination();
        hideError();
    } else {
        resultsDiv.innerHTML = "<p>No results found.</p>";
        totalPages = 1;
        updatePagination();
    }
}

function updatePagination() {
    currentPageSpan.textContent = `Page ${currentPage}`;
    prevPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;
}

function displayError(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove("hidden");
}

function hideError() {
    errorMessageDiv.classList.add("hidden");
}

function handleRateLimit(query, page, retryCount = 0) {
    if (retryCount >= 3) {
        displayError("Too many retries. Please try again later.");
        return;
    }

    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    setTimeout(() => {
        searchMovies(query, page).catch(() => handleRateLimit(query, page, retryCount + 1));
    }, delay);
}

searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
        currentQuery = query;
        currentPage = 1;
        searchMovies(currentQuery, currentPage);
    }
});

prevPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        searchMovies(currentQuery, currentPage);
    }
});

nextPageButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        searchMovies(currentQuery, currentPage);
    }
});