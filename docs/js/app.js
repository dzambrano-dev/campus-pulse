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

const moonSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M20.71 13.51c-.78.23-1.58.35-2.38.35-4.52 0-8.2-3.68-8.2-8.2 0-.8.12-1.6.35-2.38a1.002 1.002 0 0 0-1.25-1.25A10.17 10.17 0 0 0 2 11.8C2 17.42 6.58 22 12.2 22c4.53 0 8.45-2.91 9.76-7.24a1.002 1.002 0 0 0-1.25-1.25"></path><path d="m16 8 .94-2.06L19 5l-2.06-.94L16 2l-.94 2.06L13 5l2.06.94zm4.25-.5-.55 1.2-1.2.55 1.2.55.55 1.2.55-1.2 1.2-.55-1.2-.55z"></path></svg>`;
const sunSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M12 6.99a5.01 5.01 0 1 0 0 10.02 5.01 5.01 0 1 0 0-10.02M13 19h-2v3h2zm0-17h-2v3h2zM2 11h3v2H2zm17 0h3v2h-3zM4.22 18.36l.71.71.71.71 1.06-1.06 1.06-1.06-.71-.71-.71-.71-1.06 1.06zM19.78 5.64l-.71-.71-.71-.71-1.06 1.06-1.06 1.06.71.71.71.71 1.06-1.06zm-12.02.7L6.7 5.28 5.64 4.22l-.71.71-.71.71L5.28 6.7l1.06 1.06.71-.71zm8.48 11.32 1.06 1.06 1.06 1.06.71-.71.71-.71-1.06-1.06-1.06-1.06-.71.71z"></path></svg>`;
const calendarSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M19 4h-2V2h-2v2H9V2H7v2H5c-1.1 0-2 .9-2 2v1h18V6c0-1.1-.9-2-2-2M3 20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8H3zm5-6h3v-3h2v3h3v2h-3v3h-2v-3H8z"></path></svg>`

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
    initSettingsMenu();
    initEventCreation();
    initNavigation();
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
            if (!targetPage) return;

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

       const data = await safeJson(eventsResponse);
       const events = data.events || data;


       if (!Array.isArray(events)) {
            console.error("Events is not an array:", events);
            return;
        }

        // Clear events container
        const eventsContainer = document.getElementById("events-container");
        eventsContainer.innerHTML = "";

        // Create a card for each event
        events.forEach((event)=> {
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
    author.innerHTML = `Posted by <span class="author-link" data-user="${event.createdBy}">@${event.createdBy}</span>`;

    const authorLink = author.querySelector(".author-link");
    authorLink.addEventListener("click", (event) => {
        event.stopPropagation();
        // Navigate to profile
    });

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

    clubBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        // extract real ID from Cloudflare event object
        const eventId =
            event.id ||
            event._id ||
            event.eventId ||
            event.key ||
            event.uuid;
        console.log("CLICKED EVENT:", event);
        console.log("USING EVENT ID:", eventId);

        if (!eventId) {
            console.error("No valid event ID found on event:", event);
            return;
        }
        window.location.href = `event.html?id=${eventId}`;
    });

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
async function loadMapEvents() {
    try {
        const endpoint = `${API}/get-events`;
        const response = await fetch(endpoint, {
            credentials: "include"
        });

        if (!response.ok) return;

        const events = await safeJson(response);
        renderMapMarkers(events);
    } catch (err) {
        console.error("Map event load failed:", err);
    }
}

// for icons_test on map
function getEventIcon(type){
    const cleanType = (type || "organization")
        .toString()
        .trim()
        .toLowerCase();

    return L.divIcon({
        className: "map-marker",
        html: `<div class="marker ${cleanType}"></div>`,
        iconSize: [26,26],
        iconAnchor: [13,13]
    });
}

// Render map markers
function renderMapMarkers(events) {
    mapMarkers.forEach(marker => marker.remove());
    mapMarkers = [];

    events.forEach(event => {
        console.log("EVENT OBJECT:", event);
        if (!event.lat || !event.lng) return;
        const marker = L.marker(
            [event.lat, event.lng],
            { icon: getEventIcon(event.type) }
        ).addTo(map);

        // Create a tooltip
        marker.bindTooltip(event.title, {
            permanent: true,
            direction: "top",
            offset: [0, -10],
            className: "map-label-tooltip"
        });

        // Create popups for each pin
        const popupDiv = document.createElement("div");
        popupDiv.className = "map-popup-card";
        const title = document.createElement("h3");
        title.textContent = event.title;
        const location = document.createElement("p");
        location.textContent = event.location;
        const time = document.createElement("p");
        time.textContent = formatEventTime(event.datetime);
        const button = document.createElement("button");
        button.className = "popup-event-btn";
        button.textContent = "View Event";
        button.addEventListener("click", () => {
            const eventId = event.id;
            if (!eventId) {
                console.error("No valid event ID found.");
                return;
            }
            window.location.href = `event.html?id=${eventId}`;
        })
        popupDiv.append(title, location, time, button);

        marker.bindPopup(popupDiv);
        // Hide label when popup opens
        marker.on("popupopen", () => {
            marker.unbindTooltip();
        });

        // Restore label when popup closes
        marker.on("popupclose", () => {
            marker.bindTooltip(String(event.title), {
                permanent: true,
                direction: "top",
                offset: [0, -10],
                className: "map-label-tooltip"
            });
        });

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

// Generate Event Creation module
function initEventCreation() {
    // only admins / organizers
    if (!["organizer", "admin"].includes(currentRole)) return;

    const navBar = document.querySelector(".navigation-bar");
    const appContainer = document.querySelector(".app-container");
    if (!navBar || !appContainer) return;

    // Create the event button in the center of our nav bar
    const creationButton = document.createElement("button");
    creationButton.className = "nav-button";
    creationButton.dataset.page = "create-event-page";
    creationButton.innerHTML = calendarSVG;
    navBar.insertBefore(creationButton, navBar.children[1]);

    // Create the event creation page
    const creationPage = document.createElement("section");
    creationPage.className = "app-page";
    creationPage.id = "create-event-page";
    creationPage.innerHTML = `
        <div class="create-event-page">
            <h2 class="event-header">Create an Event</h2>
            <div class="event-body">
                <form id="event-form">
                    <input id="event-title" placeholder="Event Title" required>
                    <textarea id="event-description" placeholder="Description" maxlength="500" required></textarea>

                    <!-- Event Type -->
                    <label>Event Type</label>
                    <select id="event-type" required>
                        <option value="" disabled selected>Select event type</option>
                        <option value="alert">Alert</option>
                        <option value="academic">Academic</option>
                        <option value="athletic">Athletic</option>
                        <option value="career">Career</option>
                        <option value="organization">Organization</option>
                        <option value="social">Social</option>
                    </select>

                    <label>Tags</label>
                    <!-- Tags injected by JS -->
                    <div id="event-tags" class="tag-container"></div>

                    <!-- Date -->
                    <label>Date</label>
                    <input type="date" id="event-date" required>

                    <!-- Time & Location -->
                    <label>Time</label>
                    <input type="time" id="event-time" required>
                    <input id="event-location" placeholder="Location" required>

                    <!-- Map pin -->
                    <label>Click map to place a pin</label>
                    <div id="event-map" class="event-map"></div>

                    <!-- Upload event image -->
                    <label>Event Image</label>
                    <input type="file" id="event-image" accept="image/*">

                    <!-- Error messages -->
                    <div class="error" id="event-error"></div>

                    <!-- Action buttons -->
                    <div class="event-actions">
                        <button type="submit" class="primary-button" id="submit-event-button">Create</button>
                        <button type="button" class="secondary-button" id="reset-event-button">Reset</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    appContainer.insertBefore(creationPage, appContainer.children[1]);

    // Page initialization
    creationButton.addEventListener("click", () => {
        loadTags();

        setTimeout(() => {
            initEventMap();
        }, 50);
    });

    // Form submission
    const form = creationPage.querySelector("#event-form");
    form.addEventListener("submit", submitEvent);

    form.addEventListener("reset", () => {
        // Clear errors
        const eventError = document.getElementById("event-error");
        clearErrors(eventError);

        document.getElementById("event-form").reset();
        document.getElementById("event-type").value = "";

        // Clear tags
        document.querySelectorAll(".tag.active").forEach(tag => tag.classList.remove("active"));

        // Reset map marker
        if (eventMarker && eventMap) {
            eventMap.removeLayer(eventMarker);
            eventMarker = null;
        }

        // Reset map view
        if (eventMap) {
            eventMap.setView([33.7838, -118.1141], 15);
        }

        // Reset loading state
        const submitButton = document.getElementById("submit-event-button");
        setLoading(submitButton, false);
    });
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
    const eventType = document.getElementById("event-type").value;
    const tags = [...document.querySelectorAll(".tag.active")].map(t => t.textContent);
    const date = document.getElementById("event-date").value;
    const time = document.getElementById("event-time").value;
    const location = document.getElementById("event-location").value;
    const latlng = eventMarker ? eventMarker.getLatLng() : null;

    // Validate data
    if (!title) { showError(eventError, "Event title is required"); setLoading(submitButton, false); return; }
    if (description.length < 50) { showError(eventError, "Description must be at least 50 characters"); setLoading(submitButton, false); return; }
    if (!eventType) { showError(eventError, "Please select an event type"); setLoading(submitButton, false); return; }
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
        type: eventType,
        tags: tags,
        datetime: timestamp,
        location: location,
        lat: latlng.lat,
        lng: latlng.lng,
        image: null,
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

        // Reset form
        document.getElementById("event-form").reset();

        // Switch to events
        document.querySelector('[data-page="events-page"]').click();

        await loadEvents();
    } catch (err) {
        console.error("Event creation failed:", err);
        showError(eventError, "Network error, please try again");
        setLoading(submitButton, false);
    }
}

// Initialize settings menu
function initSettingsMenu () {
    const icon = document.getElementById("theme-icon");
    if (icon) {
        const isDark = document.body.classList.contains("dark-mode");
        icon.innerHTML = isDark ? sunSVG : moonSVG;
    }

    const menu = document.getElementById("settings-menu");
    const button = document.getElementById("settings-button");
    if (!button || !menu) return;

    document.getElementById("go-to-profile").addEventListener("click", goProfile);

    document.addEventListener("click", (event) => {
        const clickedButton = button.contains(event.target);
        const clickedMenu = menu.contains(event.target);

        if (clickedButton) {
            menu.classList.toggle("open");
        } else if (!clickedMenu) {
            menu.classList.remove("open");
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
    const date = new Date(timestamp * 1000); // assuming UNIX timestamp

    const month = date.toLocaleString("default", { month: "long" });
    const day = date.getDate();
    const time = date.toLocaleString("default", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });

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
    const isDark = document.body.classList.toggle("dark-mode");
    const icon = document.getElementById("theme-icon");
    if (icon) icon.innerHTML = isDark ? sunSVG : moonSVG;

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

//make profile clickable
function goProfile(){
    window.location.href = "profile.html";
}