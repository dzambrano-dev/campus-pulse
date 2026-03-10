//app.js
// Get username from URL
const params = new URLSearchParams(window.location.search);
const username = params.get("user");

// Redirect to log in if username is missing
if (!username) {
    window.location.href = "index.html";
}

// Fetch buttons and pages
const navButtons = document.querySelectorAll(".nav-button");
const pages = document.querySelectorAll(".app-page");

// Add listeners to each button
navButtons.forEach(button => {
    button.addEventListener("click", () => {
        // Page belonging to current button
        const targetPage = button.dataset.page;

        // Hide all pages
        pages.forEach(page => {
            page.classList.remove("active");
        });

        // Remove active state from all buttons
        navButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        // Show selected page
        document.getElementById(targetPage).classList.add("active");

        // Mark button as active
        button.classList.add("active");
    });
});

async function loadFeed()
{
    try
    {
        const response = await fetch("data/events.json");
        const data = await response.json();

        const feed = document.getElementById("feed-container");

        // show newest events first
        data.reverse();

        data.forEach(event =>
        {
            const card = document.createElement("div");
            card.classList.add("feed-card");

            card.innerHTML = `
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <p><strong>${event.category}</strong></p>
            `;

            feed.appendChild(card);
        });
    }
    catch(err)
    {
        console.error("Failed to load feed:", err);
    }
}

document.addEventListener("DOMContentLoaded", loadFeed);
