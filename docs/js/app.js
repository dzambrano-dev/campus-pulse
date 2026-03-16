//app.js
let token;
let currentUser;
let currentRole;

let eventMap;
let eventMarker;

const API = "https://campus-pulse-worker.vindictivity.workers.dev/api";

document.addEventListener("DOMContentLoaded", initApp);

// Main application startup
async function initApp() {
    token = localStorage.getItem("sessionToken");

    // Redirect if not logged in
    if (!token) {
        redirectToLogin();
        return;
    }

    // Validate session and load user
    const user = await loadUser();

    if (!user) {
        localStorage.removeItem("sessionToken");
        redirectToLogin();
        return;
    }

    currentUser = user.username;
    currentRole = user.role;

    // Initialize navigation
    initNavigation();
    addCreateEventButton();

    // Load application
    await loadEvents();
    await loadFeed();
}

// Authenticate user
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

// Initialize navigation bar
function initNavigation() {
    const navButtons = document.querySelectorAll(".nav-button");
    const pages = document.querySelectorAll(".app-page");

    // Set up buttons
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

            // Redraw map if map page is open
            if (targetPage === "map-page") {
                setTimeout(() => {
                    if (window.map) window.map.invalidateSize();
                }, 100);
            }
        });
    });
}

// Generate addEvent button
function addCreateEventButton() {
    if (currentRole === "organizer" || currentRole === "admin") {
        const nav = document.querySelector(".bottom-nav");

        const addEventButton = document.createElement("button");
        addEventButton.classList.add("floating-nav-button");
        addEventButton.id = "add-event-button";
        addEventButton.textContent = "+";

        addEventButton.addEventListener("click", openCreateEvent);

        const closeEventButton = document.getElementById("cancel-event");
        closeEventButton.addEventListener("click", closeCreateEvent);

        // Insert button in the middle
        const index = Math.floor(nav.children.length / 2);
        if (nav.children[index]) {
            nav.insertBefore(addEventButton, nav.children[index]);
        } else {
            nav.appendChild(addEventButton);
        }

        document.getElementById("event-form").addEventListener("submit", submitEvent);
    }
}

// LOAD EVENTS
async function loadEvents() {
    try {
        // Fetch list of events the user is interested in
        const eventsEndpoint = `${API}/events`
        const eventsResponse = await fetch(eventsEndpoint, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        // If no events are found, return
        if (!eventsResponse.ok) {
            console.error("Failed to load events:", eventsResponse.status);
            return;
        }

        const eventsData = await eventsResponse.json();

        // find events container
        const eventsContainer = document.getElementById("events-container");

        // stop if container doesn't exist
        if (!eventsContainer) return;

        // clear container to prevent duplicate cards
        eventsContainer.innerHTML = "";

        // sort events by date (earliest first)
        eventsData.sort((a, b) => a.date - b.date);

        // create a card for each event
        eventsData.forEach(event => {

            const card = document.createElement("div");
            card.classList.add("feed-card");

            // convert event date to readable month/day
            const eventDate = new Date(event.date * 1000);
            const month = eventDate.toLocaleString("default", { month: "short" }).toUpperCase();
            const day = eventDate.getDate();

            // build card HTML
            card.innerHTML = `
                <div class="event-image-wrapper">
                    <img class="event-image" src="${event.image}" onerror="this.src='assets/eventImages/default.png'" alt="${event.title}">
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

// Open create event modal
function openCreateEvent() {
    const eventModal = document.getElementById("event-modal");
    eventModal.classList.remove("hidden");
    loadTags();
    setTimeout(() => { initEventMap(); }, 50);
}

// Close create event modal
function closeCreateEvent() {
    const eventError = document.getElementById("event-error");
    eventError.textContent = "";

    document.getElementById("event-form").reset();
    document.querySelectorAll(".tag.active").forEach(tag => tag.classList.remove("active"));

    eventMarker = null;

    if (eventMap) {
        eventMap.remove();
        eventMap = null;
    }

    document.getElementById("event-modal").classList.add("hidden");
}

// Load a list of tags
async function loadTags() {
    const interestsEndpoint = `${API}/interests`;
    const interestsResponse = await fetch(interestsEndpoint);
    const data = await interestsResponse.json();

    const tagContainer = document.getElementById("event-tags");
    tagContainer.innerHTML = "";

    data.interests.forEach(tag => {
        const btn = document.createElement("div");
        btn.classList.add("tag");
        btn.textContent = `${tag}`;
        btn.onclick = () => btn.classList.toggle("active");
        tagContainer.appendChild(btn);
    })
}

// Initialize the create event map
function initEventMap() {
    if (eventMap) eventMap.remove();
    eventMap = L.map("event-map").setView([33.7838, -118.1141], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(eventMap);

    eventMarker = null;

    eventMap.on("click", event => {
        const { lat, lng } = event.latlng;
        if (eventMarker) {
            eventMarker.setLatLng([lat, lng]);
        } else {
            eventMarker = L.marker([lat, lng]).addTo(eventMap);
        }
    });
}

// Convert a datetime to a Unix timestamp
function toUTCTimestamp(date, time) {
    const local = new Date(`${date}T${time}`);
    return Math.floor(local.getTime() / 1000);
}

// Submit the event
async function submitEvent(event) {
    event.preventDefault();

    const eventError = document.getElementById("event-error");
    eventError.textContent = "";

    const title = document.getElementById("event-title").value;
    const description = document.getElementById("event-description").value;
    const tags = [...document.querySelectorAll(".tag.active")].map(t => t.textContent);
    const date = document.getElementById("event-date").value;
    const time = document.getElementById("event-time").value;
    const location = document.getElementById("event-location").value;
    const latlng = eventMarker ? eventMarker.getLatLng() : null;

    // Validate data
    if (!title) { eventError.textContent = "Login failed"; return; }
    if (description.length < 50) { eventError.textContent = "Description must be at least 50 characters"; return; }
    if (tags.length === 0) { eventError.textContent = "Please select at least one tag"; return; }
    if (tags.length > 3) { eventError.textContent = "You can select at most 3 tags"; return; }
    if (!location) { eventError.textContent = "Please provide a location"; return; }
    if (!date || !time) { eventError.textContent = "Date and time are required"; return; }
    if (!latlng) { eventError.textContent = "Please place a pin on the map"; return; }

    // Convert datetime
    const timestamp = toUTCTimestamp(date, time);

    // Build event object
    const eventObject = {
        title: title,
        description: description,
        tags: tags,
        datetime: timestamp,
        location: location,
        lat: latlng.lat,
        lng: latlng.lng,
        image: null
    };

    // Send to API
    try {
        const createEventEndpoint = `${API}/createEvent`;
        const response = await fetch(createEventEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(eventObject)
        });

        const data = await response.json();

        if (!response.ok) {
            eventError.textContent = data.error || "Failed to create event";
            return;
        }

        closeCreateEvent();
        await loadEvents();
    } catch (err) {
        console.error("Event creation failed:", err);
        eventError.textContent = "Network error, please try again";
    }
}

// Log out
function logout() {
    localStorage.removeItem("sessionToken");
    redirectToLogin();
}

// Send user to login
function redirectToLogin() {
    window.location.assign("index.html");
}
