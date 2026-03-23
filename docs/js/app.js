/**
 * app.js
 * Handles application frontend and KV database fetching
 */


import { API, checkSession, safeJson, showError, redirect, setLoading, clearErrors } from "./utils.js";


// Data members
let currentUser;
let currentRole;
let map;
let mapMarkers = [];
let userMarker;
let eventMap;
let eventMarker;


document.addEventListener("DOMContentLoaded", initApp);


// Main application startup
async function initApp() {
    const isLoggedIn = await checkSession();

    if (!isLoggedIn) {
        redirect("index.html");
        return;
    }

    // Validate session and load user
    const user = await loadUser();
    if (!user) {
        redirect("index.html")
        return;
    }

    currentUser = user.username;
    currentRole = user.role;

    // Initialize application
    initProfileMenu();
    initNavigation();
    initCreateEventButton();
    initMap();

    await loadEvents();
}

// Authenticate user
async function loadUser() {
    try {
        const endpoint = `${API}/user`
        const response = await fetch(endpoint, {
            credentials: "include"
        });

        if (!response.ok) return null;
        return await safeJson(response);
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
                    loadMapEvents(true);
                }, 100);
            }
        });
    });
}

// Load events from API
async function loadEvents() {
    try {
        // Fetch list of events the user is interested in
        const eventsEndpoint = `${API}/get-events`
        const eventsResponse = await fetch(eventsEndpoint, {
            credentials: "include"
        });

        // If no events are found, return
        if (!eventsResponse.ok) return;

        const events = await safeJson(eventsResponse);

        // Clear events container
        const eventsContainer = document.getElementById("events-container");
        eventsContainer.innerHTML = "";

        // Create a card for each event
        events.forEach(event => {
            const card = createEventCard(event);
            eventsContainer.appendChild(card);
        });
    } catch (err) {
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
    author.className = "event-meta author-meta";

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

// Initialize map
function initMap() {
    map = L.map("map").setView([33.7838, -118.1141], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
}

// Fetch events to create pins for
async function loadMapEvents(showAllPopups = false) {
    try {
        const endpoint = `${API}/get-events`;
        const response = await fetch(endpoint, {
            credentials: "include"
        });

        if (!response.ok) return;

        const events = await safeJson(response);
        renderMapMarkers(events, showAllPopups);
    } catch (err) {
        console.error("Map event load failed:", err);
    }
}

// Render map markers
function renderMapMarkers(events, showAllPopups = false) {
    mapMarkers.forEach(marker => marker.remove());
    mapMarkers = [];

    events.forEach(event => {
        if (!event.lat || !event.lng) return;
        const marker = L.marker([event.lat, event.lng]).addTo(map);
        const popup = L.popup({ closeButton: false, autoClose: false, closeOnClick: false, className: "map-label-popup" });
        popup.setContent(event.title);
        marker.bindPopup(popup);
        if (showAllPopups) {
            setTimeout(() => marker.openPopup(), 50);
        }
            // `<strong>${event.title}</strong><br>${event.location}<br>${formatEventTime(event.datetime)}`);
        mapMarkers.push(marker);
    });
}

// Find the users location
function locateUser() {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;

        // Remove previous marker if it exists
        if (userMarker) map.removeLayer(userMarker);

        // Create a blue circle marker
        const userStyle = {
            radius: 8,
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 1,
            weight: 2
        }
        userMarker = L.circleMarker([latitude, longitude], userStyle).addTo(map);
        map.setView([latitude, longitude], 16);  // Center map on user
        },
        err => { console.warn("Location permission denied", err) },
        { enableHighAccuracy: true }
    );
}

// Generate addEvent button
function initCreateEventButton() {
    // Only show button to admins and organizers
    if (!["organizer", "admin"].includes(currentRole)) return;

    const nav = document.querySelector(".bottom-nav");

    const addEventButton = document.createElement("button");
    addEventButton.textContent = "+";
    addEventButton.classList.add("floating-nav-button");
    addEventButton.id = "add-event-button";

    addEventButton.addEventListener("click", openCreateEvent);
    nav.appendChild(addEventButton);

    const closeEventButton = document.getElementById("cancel-event-button");
    closeEventButton.addEventListener("click", closeCreateEvent);

    document.getElementById("event-form").addEventListener("submit", submitEvent);
}

// Open create event modal
function openCreateEvent() {
    const eventModal = document.getElementById("event-modal");
    eventModal.classList.remove("hidden");
    document.body.classList.add("no-scroll");

    loadTags();
    setTimeout(initEventMap, 50);
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
    setLoading(submitButton, false);

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

// Submit the event
async function submitEvent(event) {
    event.preventDefault();
    const eventError = document.getElementById("event-error");
    clearErrors(eventError);

    // Disable button
    const submitButton = document.getElementById("submit-event-button");
    setLoading(submitButton, true);

    // Organize data
    const title = document.getElementById("event-title").value;
    const description = document.getElementById("event-description").value;
    const tags = [...document.querySelectorAll(".tag.active")].map(t => t.textContent);
    const date = document.getElementById("event-date").value;
    const time = document.getElementById("event-time").value;
    const location = document.getElementById("event-location").value;
    const latlng = eventMarker ? eventMarker.getLatLng() : null;

    // Validate data
    if (!title) { showError(eventError, "Event title is required"); setLoading(submitButton, false); return; }
    if (description.length < 50) { showError(eventError, "Description must be at least 50 characters"); setLoading(submitButton, false); return; }
    if (tags.length === 0) { showError(eventError, "Please select at least one tag"); setLoading(submitButton, false); return; }
    if (tags.length > 3) { showError(eventError, "You can select at most 3 tags"); setLoading(submitButton, false); return; }
    if (!location) { showError(eventError, "Please provide a location"); setLoading(submitButton, false); return; }
    if (!date || !time) { showError(eventError, "Date and time are required"); setLoading(submitButton, false); return; }
    if (!latlng) { showError(eventError, "Please place a pin on the map"); setLoading(submitButton, false); return; }

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

    try {
        const createEventEndpoint = `${API}/create-event`;
        const response = await fetch(createEventEndpoint, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventObject)
        });

        const result = await safeJson(response);

        if (!response.ok) {
            showError(eventError, result.error || "Failed to create event");
            setLoading(submitButton, false);
            return;
        }

        closeCreateEvent();
        await loadEvents();
    } catch (err) {
        console.error("Event creation failed:", err);
        showError(eventError, "Network error, please try again");
        setLoading(submitButton, false);
    }
}

// Initialize profile menu
function initProfileMenu () {
    const menu = document.getElementById("profile-menu");
    const button = document.getElementById("profile-button");

    document.addEventListener("click", (event) => {
        const clickedButton = button.contains(event.target);
        const clickedMenu = menu.contains(event.target);

        if (clickedButton) {
            menu.classList.toggle("hidden");
        } else if (!clickedMenu) {
            menu.classList.add("hidden");
        }
    });

    document.getElementById("toggle-theme").addEventListener("click", toggleTheme);
    document.getElementById("toggle-ui").addEventListener("click", toggleUI);
    document.getElementById("logout-button").addEventListener("click", logout);
}

// Log out
async function logout() {
    try {
        const endpoint = `${API}/logout`;
        await fetch(endpoint, {
            method: "POST",
            credentials: "include"
        });
    } catch {}

    redirect("index.html");
}

// Format event datetime
function formatEventTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const month = date.toLocaleString("default", { month: "long" });
    const day = date.getDate();
    const time = date.toLocaleString("default", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${month} ${day}, ${time}`;
}

// Convert a datetime to a Unix timestamp
function toUTCTimestamp(date, time) {
    const local = new Date(`${date}T${time}`);
    return Math.floor(local.getTime() / 1000);
}

// Uppercase the first letter of each word
function toTitleCase(str) {
    return str.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    if (map) {
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });

        const isDark = document.body.classList.contains("dark-mode");

        const tile = isDark
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

        L.tileLayer(tile, {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);
    }
}

function toggleUI() {
    document.body.classList.toggle("compact-ui");
}
