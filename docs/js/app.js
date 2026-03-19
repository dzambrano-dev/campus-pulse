/**
 * app.js
 * Application script
 */

let token;
let currentUser;
let currentRole;

let map;
let mapMarkers = [];
let userMarker;

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
    initMap();

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
                    if (map) map.invalidateSize();
                    locateUser();
                    loadMapEvents();
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

        const closeEventButton = document.getElementById("cancel-event-button");
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

// Load events from API
async function loadEvents() {
    try {
        // Fetch list of events the user is interested in
        const eventsEndpoint = `${API}/get-events`
        const eventsResponse = await fetch(eventsEndpoint, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        // If no events are found, return
        if (!eventsResponse.ok) {
            console.error("Failed to load events:", eventsResponse.status);
            return;
        }

        const eventsData = await eventsResponse.json();

        // Clear events container
        const eventsContainer = document.getElementById("events-container");
        eventsContainer.innerHTML = "";

        // Create a card for each event
        eventsData.forEach(event => {
            const card = createEventCard(event);
            eventsContainer.appendChild(card);
        });
    } catch (err) {
        // log error if events fail to load
        console.error("Failed to load events:", err);
    }
}

// Create an event card
function createEventCard(event) {
    const card = document.createElement("div");
    card.className = "event-card";

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "event-image-wrapper";

    const img = document.createElement("img");
    img.className = "event-image";
    img.src = event.image || "assets/eventImages/default.png";
    img.alt = event.title;

    const dateBadge = document.createElement("div");
    dateBadge.className = "event-date";

    const eventTime = new Date(event.datetime * 1000)
    const month = document.createElement("span");
    month.className = "month";
    month.textContent = eventTime.toLocaleString("default", { month: "short" }).toUpperCase();

    const day = document.createElement("span");
    day.className = "day";
    day.textContent = `${eventTime.getDate()}`;

    dateBadge.append(month, day);
    imageWrapper.append(img, dateBadge);

    const content = document.createElement("div");
    content.className = "event-content";

    const title = document.createElement("h3");
    title.className = "event-title";
    title.textContent = event.title;

    const location = document.createElement("div");
    location.className = "event-meta";
    location.textContent = event.location;

    const time = document.createElement("div");
    time.className = "event-meta";
    time.textContent = formatEventTime(event.datetime);

    const author = document.createElement("div");
    author.className = "event-meta";

    const authorLink = document.createElement("span");
    authorLink.className = "author-link";
    authorLink.dataset.user = event.createdBy;
    authorLink.textContent = `@${event.createdBy}`;

    author.textContent = "Posted by ";
    author.appendChild(authorLink);

    const description = document.createElement("p");
    description.className = "event-description";
    description.textContent = event.description;

    const tags = document.createElement("div");
    tags.className = "event-tags";

    (event.tags || []).forEach(tag => {
        const bubble = document.createElement("span");
        bubble.className = "tag-bubble";
        bubble.textContent = toTitleCase(tag);
        tags.appendChild(bubble);
    });

    const actions = document.createElement("div");
    actions.className = "event-actions";

    const clubBtn = document.createElement("button");
    clubBtn.className = "primary-button";
    clubBtn.textContent = "See Details";

    const mapBtn = document.createElement("button");
    mapBtn.className = "tertiary-button";
    mapBtn.textContent = "Show on Map";

    // Add map button listeners
    mapBtn.addEventListener("click", () => {
        // Switch to map
        document.querySelector('[data-page="map-page"]').click();

        setTimeout(() => {
            map.invalidateSize();
            const latlng = [event.lat, event.lng];
            const marker = L.marker(latlng).addTo(map);
            map.setView(latlng, 17);
            marker.bindPopup(`<strong>${event.title}</strong><br>${event.location}<br>${formatEventTime(event.datetime)}`).openPopup();
        }, 150);
    });

    actions.append(clubBtn, mapBtn);
    content.append(title, location, time, author, description, tags, actions);
    card.append(imageWrapper, content);
    return card;
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

// Initialize map
function initMap() {
    map = L.map("map").setView([33.7838, -118.1141], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
}

// Fetch events to create pins for
async function loadMapEvents() {
    try {
        const endpoint = `${API}/get-events`;
        const response = await fetch(endpoint, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error("Failed to load map events:", response.status);
            return;
        }

        const events = await response.json();
        renderMapMarkers(events);
    } catch (err) {
        console.error("Map event load failed:", err);
    }
}

// Render map markers
function renderMapMarkers(events) {
    if (!map) return;

    // Remove existing markers
    mapMarkers.forEach(marker => marker.remove());
    mapMarkers = [];

    events.forEach(event => {
        if (!event.lat || !event.lng) return;
        const marker = L.marker([event.lat, event.lng]).addTo(map);
        marker.bindPopup(`<strong>${event.title}</strong><br>${event.location}<br>${formatEventTime(event.datetime)}`);
        mapMarkers.push(marker);
    });
}

// Find the users location
function locateUser() {
    if (!navigator.geolocation) {
        console.warn("Geolocation is not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Remove previous marker if it exists
            if (userMarker) {
                map.removeLayer(userMarker);
            }

            // Create a blue circle marker
            userMarker = L.circleMarker([lat, lng], {
                radius: 8,
                color: "#2563eb",
                fillColor: "#3b82f6",
                fillOpacity: 1,
                weight: 2
            }).addTo(map);

            userMarker.bindPopup("You're here");

            // Center map on user
            map.setView([lat, lng], 16);
        },
        err => {
            console.warn("Location permission denied");
        },
        {
            enableHighAccuracy: true
        }
    );
}

// Open create event modal
function openCreateEvent() {
    const eventModal = document.getElementById("event-modal");
    eventModal.classList.remove("hidden");
    document.body.classList.add("no-scroll");

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

    const submitButton = document.getElementById("submit-event-button");
    submitButton.disabled = false;

    document.getElementById("event-modal").classList.add("hidden");
    document.body.classList.remove("no-scroll");
}

// Load a list of tags
async function loadTags() {
    const interestsEndpoint = `${API}/get-interests`;
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

    // Disable button
    const submitButton = document.getElementById("submit-event-button");
    submitButton.disabled = true;

    // Organize data
    const title = document.getElementById("event-title").value;
    const description = document.getElementById("event-description").value;
    const tags = [...document.querySelectorAll(".tag.active")].map(t => t.textContent);
    const date = document.getElementById("event-date").value;
    const time = document.getElementById("event-time").value;
    const location = document.getElementById("event-location").value;
    const latlng = eventMarker ? eventMarker.getLatLng() : null;

    // Validate data
    if (!title) { eventError.textContent = "Event title is required"; submitButton.disabled = false; return; }
    if (description.length < 50) { eventError.textContent = "Description must be at least 50 characters"; submitButton.disabled = false; return; }
    if (tags.length === 0) { eventError.textContent = "Please select at least one tag"; submitButton.disabled = false; return; }
    if (tags.length > 3) { eventError.textContent = "You can select at most 3 tags"; submitButton.disabled = false; return; }
    if (!location) { eventError.textContent = "Please provide a location"; submitButton.disabled = false; return; }
    if (!date || !time) { eventError.textContent = "Date and time are required"; submitButton.disabled = false; return; }
    if (!latlng) { eventError.textContent = "Please place a pin on the map"; submitButton.disabled = false; return; }

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
        const createEventEndpoint = `${API}/create-event`;
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
            submitButton.disabled = false;
            return;
        }

        closeCreateEvent();
        await loadEvents();
    } catch (err) {
        console.error("Event creation failed:", err);
        submitButton.disabled = false;
        eventError.textContent = "Network error, please try again";
    }
}

// Format event datetime
function formatEventTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const month = date.toLocaleString("default", { month: "long" });
    const day = date.getDate();

    const time = date.toLocaleString("default", { hour: "numeric", minute: "2-digit", hour12: true });

    return `${month} ${day}, ${time}`;
}

// Generate tag HTML
function renderTags(tags) {
    return tags.map(tag => `<span class="tag-bubble">${toTitleCase(tag)}</span>`).join("");
}

// Uppercase the first letter of each word
function toTitleCase(str) {
    return str.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
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
