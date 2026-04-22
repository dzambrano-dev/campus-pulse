/**
 * app.js
 * Handles application frontend and KV database fetching
 */


import { API, checkSession, safeJson, redirect } from "./utils.js";
import { initEventCreation } from "./eventCreation.js";
import { initMap, activateMap } from "./map.js";


// Data members
let currentUser;
let currentRole;

const moonSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M20.71 13.51c-.78.23-1.58.35-2.38.35-4.52 0-8.2-3.68-8.2-8.2 0-.8.12-1.6.35-2.38a1.002 1.002 0 0 0-1.25-1.25A10.17 10.17 0 0 0 2 11.8C2 17.42 6.58 22 12.2 22c4.53 0 8.45-2.91 9.76-7.24a1.002 1.002 0 0 0-1.25-1.25"></path><path d="m16 8 .94-2.06L19 5l-2.06-.94L16 2l-.94 2.06L13 5l2.06.94zm4.25-.5-.55 1.2-1.2.55 1.2.55.55 1.2.55-1.2 1.2-.55-1.2-.55z"></path></svg>`;
const sunSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M12 6.99a5.01 5.01 0 1 0 0 10.02 5.01 5.01 0 1 0 0-10.02M13 19h-2v3h2zm0-17h-2v3h2zM2 11h3v2H2zm17 0h3v2h-3zM4.22 18.36l.71.71.71.71 1.06-1.06 1.06-1.06-.71-.71-.71-.71-1.06 1.06zM19.78 5.64l-.71-.71-.71-.71-1.06 1.06-1.06 1.06.71.71.71.71 1.06-1.06zm-12.02.7L6.7 5.28 5.64 4.22l-.71.71-.71.71L5.28 6.7l1.06 1.06.71-.71zm8.48 11.32 1.06 1.06 1.06 1.06.71-.71.71-.71-1.06-1.06-1.06-1.06-.71.71z"></path></svg>`;

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
    initEventCreation({
        currentRole, loadEvents
    });
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
                activateMap();
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

    document.getElementById("go-to-profile").addEventListener("click", goToProfile);

    document.addEventListener("click", (event) => {
        const clickedButton = button.contains(event.target);
        const clickedMenu = menu.contains(event.target);

        if (clickedButton) {
            menu.classList.toggle("open");
        } else if (!clickedMenu) {
            menu.classList.remove("open");
        }
    });

    document.getElementById("toggle-theme").addEventListener("click", toggleDarkMode);
    document.getElementById("toggle-ui").addEventListener("click", toggleCompactUI);
    document.getElementById("logout-button").addEventListener("click", logout);
}


// Send to user profile
function goToProfile(){
    window.location.href = "profile.html";
}


// Toggle dark mode
function toggleDarkMode() {
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

// Toggle compact UI for events feed
function toggleCompactUI() {
    document.body.classList.toggle("compact-ui");
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


// Uppercase the first letter of each word
function toTitleCase(str) {
    return str.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
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
