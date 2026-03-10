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

        // sort events by upcoming date
        data.sort((a, b) => new Date(a.date) - new Date(b.date));

        data.forEach(event =>
        {
            const card = document.createElement("div");
            card.classList.add("feed-card");

            // convert event date
            const eventDate = new Date(event.date);
            const month = eventDate.toLocaleString("default", { month: "short" }).toUpperCase();
            const day = eventDate.getDate();

            card.innerHTML = `

                <div class="event-image-wrapper">

                    <img 
                        src="${event.image}" 
                        class="event-image"
                        onerror="this.src='assets/eventImages/default.png'"
                    >

                    <div class="event-date">
                        <span class="month">${month}</span>
                        <span class="day">${day}</span>
                    </div>

                </div>

                <div class="feed-content">

                    <h3>${event.title}</h3>

                    <div class="event-meta">
                        ${event.club} • ${event.category}
                    </div>

                    <div class="event-meta">
                        ${event.time} • ${event.location}
                    </div>

                    <p>${event.description}</p>

                    <div class="feed-actions">

                        <button class="club-button">
                            See Club
                        </button>

                        <button class="map-button">
                            Show on Map
                        </button>

                    </div>

                </div>
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
