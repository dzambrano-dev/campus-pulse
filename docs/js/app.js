//app.js
let token;
let currentUser;

const API = "https://campus-pulse-worker.vindictivity.workers.dev/api";

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
    token = localStorage.getItem("sessionToken");

    // Redirect if not logged in
    if (!token) {
        window.location.assign("index.html");
        return;
    }

    // Validate session and fetch user
    const user = await loadUser();

    if (!user) {
        localStorage.removeItem("sessionToken");
        window.location.assign("index.html");
        return;
    }

    currentUser = user.username;

    initNavigation();

    // Load app
    await loadFeed();
    await loadEvents();
}

async function loadUser() {
    try {
        const endpoint = `${API}/user`
        const response = await fetch(endpoint, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) return null;

        return await response.json();
    } catch (err) {
        console.error("User fetch failed:", err);
        return null;
    }
}

function initNavigation() {
    const navButtons = document.querySelectorAll(".nav-button");
    const pages = document.querySelectorAll(".app-page");

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Page belonging to current button
            const targetPage = button.dataset.page;

            // Hide all pages
            pages.forEach(page => page.classList.remove("active"));

            // Remove active state from all buttons
            navButtons.forEach(btn => btn.classList.remove("active"));

            // Show selected page
            document.getElementById(targetPage).classList.add("active");
            button.classList.add("active");

            //redraw map when tab opens
            if (targetPage === "map-page") {
                setTimeout(() => {
                    if (window.map) window.map.invalidateSize();
                }, 100);
            }
        });
    });
}

// LOAD FEED
async function loadFeed() {
    try {
        // fetch feed data from JSON file
        const response = await fetch("data/feed.json");
        const data = await response.json();

        // find the container where feed items will be placed
        const feedContainer = document.getElementById("feed-container");

        // stop if the container doesn't exist
        if (!feedContainer) return;

        // clear existing feed content to prevent duplicates
        feedContainer.innerHTML = "";

        // loop through each feed item
        data.forEach(item => {

            // create a container for the feed item
            const post = document.createElement("div");
            post.classList.add("feed-item");

            // inject feed content into the element
            post.innerHTML = `
                <div class="feed-text">
                    <div class="feed-title feed-${item.type}">
                        ${item.title}
                    </div>
                    <div class="feed-meta">
                        ${item.location} • ${item.time}
                    </div>
                </div>
                <!-- container where a mini Leaflet map will render -->
                <div class="feed-map-preview"
                    data-lat="${item.lat}"
                    data-lng="${item.lng}">
                </div>
            `;

            // add the feed item to the page
            feedContainer.appendChild(post);
        });

        // create mini maps for every preview box
        document.querySelectorAll(".feed-map-preview").forEach(box => {

            // get coordinates from dataset attributes
            const lat = parseFloat(box.dataset.lat);
            const lng = parseFloat(box.dataset.lng);

            // create a non-interactive Leaflet map preview
            const miniMap = L.map(box, {
                zoomControl: false,
                attributionControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false
            }).setView([lat, lng], 14);

            // add map tiles
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(miniMap);

            // place marker at event location
            L.marker([lat, lng]).addTo(miniMap);
        });
    } catch (err) {
        // log error if feed fails to load
        console.error("Failed to load feed:", err);
    }
}

// LOAD EVENTS
async function loadEvents() {
    try {
        // fetch events JSON
        const response = await fetch("data/events.json");
        const data = await response.json();

        // find events container
        const eventsContainer = document.getElementById("events-container");

        // stop if container doesn't exist
        if (!eventsContainer) return;

        // clear container to prevent duplicate cards
        eventsContainer.innerHTML = "";

        // sort events by date (earliest first)
        data.sort((a, b) => new Date(a.date) - new Date(b.date));

        // create a card for each event
        data.forEach(event => {

            const card = document.createElement("div");
            card.classList.add("feed-card");

            // convert event date to readable month/day
            const eventDate = new Date(event.date);
            const month = eventDate.toLocaleString("default", { month: "short" }).toUpperCase();
            const day = eventDate.getDate();

            // build card HTML
            card.innerHTML = `
                <div class="event-image-wrapper">
                    <img 
                        src="${event.image}" 
                        class="event-image"
                        onerror="this.src='assets/eventImages/default.png'"
                    >
                    <!-- date badge -->
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
                        <!-- button placeholder for club page -->
                        <button class="club-button">
                            See Club
                        </button>
                        <!-- button placeholder for map navigation -->
                        <button class="map-button">
                            Show on Map
                        </button>
                    </div>
                </div>
            `;
            // add card to events container
            eventsContainer.appendChild(card);
        });
    } catch (err) {
        // log error if events fail to load
        console.error("Failed to load events:", err);
    }

}

// ADD EVENT BUTTON
// find add event button
const addEventButton = document.getElementById("add-event-button");

// only attach listener if button exists
if (addEventButton) {

    addEventButton.addEventListener("click", () => {

        // placeholder action for now
        alert("Open Add Event Form");
    });
}

// Log out
function logout() {
    localStorage.removeItem("sessionToken");
    window.location.assign("index.html");
}