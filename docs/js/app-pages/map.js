/**
 * map.js
 * Handles map functionality
 */


import { API, safeJson, updateURL } from "../utils.js";
import { loadEventPage, animateEventPage } from "./eventPage.js";


let map;
let mapMarkers = [];
let userMarker;
let labelsVisible = false;
let markersLoaded = false;

const happySVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2M8 8c1.65 0 3 1.35 3 3H9c0-.55-.45-1-1-1s-1 .45-1 1H5c0-1.65 1.35-3 3-3m4 10c-4 0-5-4-5-4h10s-1 4-5 4m5-7c0-.55-.45-1-1-1s-1 .45-1 1h-2c0-1.65 1.35-3 3-3s3 1.35 3 3z"></path></svg>`;
const academicsSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M9 3h2v18H9zm11.71 17.23-3.8-8.15-3.81-8.16-.9.42-.91.43 3.8 8.15 3.81 8.16.9-.42zM6 3h2v18H6zM3 3h2v18H3z"></path></svg>`;
const alertSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M13 4.5V3h-2v3h2zm6 6.5v2h3v-2zM5 12v-1H2v2h3zm13.72-5.3 1.06-1.06-.71-.71-.71-.71-1.06 1.06-1.06 1.06.71.71.71.71zM6.7 5.28 5.64 4.22l-.71.71-.71.71L5.28 6.7l1.06 1.06.71-.71.71-.71zm9.43 4.36c-.17-.95-1-1.64-1.97-1.64H9.83c-.97 0-1.79.69-1.97 1.64L6.34 18h11.31zM6.17 19H4v2h16v-2z"></path></svg>`;
const careerSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M20 6h-3V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2M9 4h6v2H9zm0 16H7V8h2zm8 0h-2V8h2z"></path></svg>`;
const clubSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M12 5a3 3 0 1 0 0 6 3 3 0 1 0 0-6m1 7h-2c-2.76 0-5 2.24-5 5v.5c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5V17c0-2.76-2.24-5-5-5m-6.5-1c.47 0 .9-.12 1.27-.33a5.03 5.03 0 0 1-.42-4.52C7.09 6.06 6.8 6 6.5 6 5.06 6 4 7.06 4 8.5S5.06 11 6.5 11m-.39 1H5.5C3.57 12 2 13.57 2 15.5v1c0 .28.22.5.5.5H4c0-1.96.81-3.73 2.11-5m11.39-1c1.44 0 2.5-1.06 2.5-2.5S18.94 6 17.5 6c-.31 0-.59.06-.85.15a5.03 5.03 0 0 1-.42 4.52c.37.21.79.33 1.27.33m1 1h-.61A6.97 6.97 0 0 1 20 17h1.5c.28 0 .5-.22.5-.5v-1c0-1.93-1.57-3.5-3.5-3.5"></path></svg>`;
const socialSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 14c.83 0 1.5-.67 1.5-1.5v-9c0-.83-.67-1.5-1.5-1.5h-12C2.67 2 2 2.67 2 3.5v9c0 .83.67 1.5 1.5 1.5H5v2.96c0 .42.48.65.81.39L10 14z"></path><path d="M20.5 8H19v4.5c0 1.93-1.57 3.5-3.5 3.5h-4.8l-1.51 1.21c.25.47.74.79 1.31.79H14l4.19 3.35c.33.26.81.03.81-.39V18h1.5c.83 0 1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5"></path></svg>`;
const sportsSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="m3.03 20.24.15.58.58.15c.15.04 1.79.43 4.04.43.65 0 1.35-.04 2.07-.12l-7.15-7.15c-.38 3.25.27 5.92.31 6.11M20.97 3.76l-.15-.58-.58-.15c-.2-.05-2.87-.69-6.12-.32l7.16 7.16c.38-3.25-.26-5.92-.31-6.11m-3.26 13.95c1.65-1.65 2.6-3.58 3.12-5.47l-9.07-9.07c-1.89.52-3.82 1.47-5.46 3.12-1.65 1.65-2.59 3.58-3.12 5.47l9.06 9.06c1.89-.52 3.82-1.46 5.48-3.11Zm-8-2L8.3 14.3l1.04-1.04-1.79-1.79 1.41-1.41 1.79 1.79 1.09-1.09-1.79-1.79 1.41-1.41 1.79 1.79 1.04-1.04 1.41 1.41-1.04 1.04 1.79 1.79-1.41 1.41-1.79-1.79-1.09 1.09 1.79 1.79-1.41 1.41-1.79-1.79z"></path></svg>`;

const CATEGORY_STYLES = {
    academics: { color: "#3b82f6", icon: academicsSVG },
    alert: { color: "#ef4444", icon: alertSVG },
    athletics: { color: "#22c55e", icon: sportsSVG },
    career: { color: "#8b5cf6", icon: careerSVG },
    club: { color: "#eab308", icon: clubSVG },
    social: { color: "#ec4899", icon: socialSVG }
};


// Initialize map
export function initMap() {
    if (map) return;

    map = L.map("map").setView([33.7838, -118.1141], 16);
    window.map = map;

    const isDark = document.body.classList.contains("dark-mode");
    setMapTheme(isDark);
}


// Called when map opens
export function activateMap() {
    if (!map) return;

    setTimeout(() => {
        map.invalidateSize();
        locateUser();

        if (!markersLoaded) {
            loadMapEvents();
            markersLoaded = true;
        }

        const button = document.getElementById("toggle-labels-button");
        if (!button) return;

        button.onclick = () => {
            labelsVisible = !labelsVisible;

            mapMarkers.forEach(marker => {
                marker.unbindTooltip();

                marker.bindTooltip(marker._labelText, {
                    permanent: labelsVisible,
                    direction: "top",
                    offset: [0, -16],
                    className: "map-label-tooltip"
                });
            });

            if (userMarker) {
                userMarker.unbindTooltip();
                userMarker.bindTooltip("You", {
                    permanent: labelsVisible,
                    direction: "top",
                    offset: [0, -12],
                    className: "map-label-tooltip"
                });
            }
        }
    }, 100);
}


// Fetch events to create pins for
async function loadMapEvents() {
    try {
        const endpoint = `${API}/get-events`;
        const response = await fetch(endpoint, {
            credentials: "include"
        });

        if (!response.ok) return;

        const data = await safeJson(response);
        const events = data.events || data;
        renderMapMarkers(events);
    } catch (err) {
        console.error("Map event load failed:", err);
    }
}


// Render map markers
function renderMapMarkers(events) {
    mapMarkers.forEach(marker => marker.remove());
    mapMarkers = [];

    events.forEach(event => {
        if (!event.lat || !event.lng) return;
        const marker = L.marker(
            [event.lat, event.lng],
            { icon: getEventIcon(event) }
        ).addTo(map);

        marker._eventId = event.id;

        // Create a tooltip
        marker._labelText = event.title;

        marker.bindTooltip(event.title, {
            permanent: labelsVisible,
            direction: "top",
            offset: [0, -16],
            className: "map-label-tooltip"
        });

        // Create popups for each pin
        const popupDiv = document.createElement("div");
        popupDiv.className = "map-popup-card";
        const title = document.createElement("h3");
        title.textContent = event.title;
        const location = document.createElement("p");
        location.textContent = event.location;
        const brk = document.createElement("br");
        const time = document.createElement("p");
        time.textContent = formatEventTime(event.datetime);

        const rawType = event.type || "club";
        const type = rawType.toString().trim().toLowerCase();
        const config = CATEGORY_STYLES[type] || CATEGORY_STYLES["club"];

        const button = document.createElement("button");
        button.className = "popup-event-button";
        button.style.background = config.color;
        button.style.color = "#ffffff";
        button.textContent = "View Event";
        button.addEventListener("click", () => {
            const eventId = event.id;
            if (!eventId) {
                console.error("No valid event ID found.");
                return;
            }

            map.closePopup();
            updateURL("event", eventId);
            loadEventPage(eventId);
            animateEventPage();
        });
        popupDiv.append(title, location, brk, time, button);

        marker.bindPopup(popupDiv, {
            offset: [0, -21]
        });

        mapMarkers.push(marker);
        window.mapMarkers = mapMarkers;
    });
}


// Get user icon
function getUserIcon() {
    return L.divIcon({
        className: "map-marker-wrapper",
        html: `
            <div class="user-pin">
                <div class="user-pin-inner" style="...">
                    <div class="user-pin-icon">
                        ${happySVG}
                    </div>
                </div>
            </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}


// Get icon based on event type
function getEventIcon(event) {
    const rawType = event.type || "club";
    const type = rawType.toString().trim().toLowerCase();
    const config = CATEGORY_STYLES[type] || CATEGORY_STYLES["club"];

    return L.divIcon({
        className: "map-marker-wrapper",
        html: `
            <div class="map-pin">
                <div class="map-pin-inner" style="background:${config.color}">
                    <div class="map-pin-icon">
                        ${config.icon}
                    </div>
                </div>
            </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
    });
}


// Find the users location
function locateUser() {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;

        // Remove previous marker if it exists
        if (userMarker) map.removeLayer(userMarker);

        // Create blue user marker
        userMarker = L.marker(
            [latitude, longitude],
            { icon: getUserIcon() }
        ).addTo(map);

        userMarker._labelText = "You";

        userMarker.bindTooltip("You", {
            permanent: labelsVisible,
            direction: "top",
            offset: [0, -12],
            className: "map-label-tooltip"
        });
    });
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

// Change map to dark mode
export function setMapTheme(isDark) {
    if (!map) return;

    // Remove existing tile layers only
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
        }
    });

    const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    L.tileLayer(tileUrl, {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
}