/**
 * map.js
 * Handles map functionality
 */


import { API, safeJson, getTileUrl, TILE_ATTRIBUTION } from "../utils.js";
import { CATEGORIES, getCategoryKey, categoryChipHTML, formatFullDate, escapeHTML } from "../categories.js";
import { icon } from "../icons.js";
import { openEvent } from "./eventPage.js";


let map;
let mapMarkers = [];
let userMarker;
let labelsVisible = false;
let markersLoaded = false;
let tileLayer;
let activeCategory = "all";



// Initialize map
export function initMap() {
    if (map) return;

    map = L.map("map").setView([33.7838, -118.1141], 16);
    window.map = map;

    map.zoomControl.setPosition("bottomright");
    setMapTheme();
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
            button.setAttribute("aria-pressed", String(labelsVisible));

            mapMarkers.forEach(marker => {
                marker.unbindTooltip();

                marker.bindTooltip(marker._labelText, {
                    permanent: labelsVisible,
                    direction: "top",
                    offset: [0, -18],
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
        const type = getCategoryKey(event.type);
        marker._category = type;

        const popupDiv = document.createElement("div");
        popupDiv.className = "map-popup-card";
        popupDiv.dataset.cat = type;
        popupDiv.innerHTML = `
            ${categoryChipHTML(type)}
            <h3>${escapeHTML(event.title)}</h3>
            <p>${icon("calendar")}<span>${formatFullDate(event.datetime)}</span></p>
            <p>${icon("pin")}<span>${escapeHTML(event.location || "Location TBA")}</span></p>
            <button class="primary-button popup-event-button">View event ${icon("arrow")}</button>
        `;

        popupDiv.querySelector("button").addEventListener("click", () => {
            const eventId = event.id;
            if (!eventId) {
                console.error("No valid event ID found.");
                return;
            }

            map.closePopup();
            openEvent(eventId);
        });

        marker.bindPopup(popupDiv, {
            offset: [0, -16],
            closeButton: false,
            maxWidth: 320,
            autoPanPaddingTopLeft: [16, 64],
            autoPanPaddingBottomRight: [16, 16]
        });

        mapMarkers.push(marker);
        window.mapMarkers = mapMarkers;
    });

    renderLegend(events);
    applyCategoryFilter();
}


// Category legend that doubles as a filter
function renderLegend(events) {
    const legend = document.getElementById("map-legend");
    if (!legend) return;
    legend.innerHTML = "";

    const present = new Set(events.map(event => getCategoryKey(event.type)));
    Object.entries(CATEGORIES).forEach(([key, { label }]) => {
        if (!present.has(key)) return;

        const chip = document.createElement("button");
        chip.className = "chip map-legend-chip";
        chip.dataset.cat = key;
        chip.setAttribute("aria-pressed", String(activeCategory === key));
        chip.innerHTML = `${icon(key)}<span>${label}</span>`;
        chip.addEventListener("click", () => {
            activeCategory = activeCategory === key ? "all" : key;
            legend.querySelectorAll(".chip").forEach(c => {
                c.setAttribute("aria-pressed", String(c.dataset.cat === activeCategory));
            });
            applyCategoryFilter();
        });
        legend.appendChild(chip);
    });
}


// Show only markers in the selected category
function applyCategoryFilter() {
    mapMarkers.forEach(marker => {
        const show = activeCategory === "all" || marker._category === activeCategory;
        if (show && !map.hasLayer(marker)) marker.addTo(map);
        if (!show && map.hasLayer(marker)) marker.remove();
    });
}


// Get user icon
function getUserIcon() {
    return L.divIcon({
        className: "map-marker-wrapper",
        html: `<div class="user-pin"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}


// Get icon based on event type
function getEventIcon(event) {
    const type = getCategoryKey(event.type);

    return L.divIcon({
        className: "map-marker-wrapper",
        html: `<div class="map-pin" data-cat="${type}">${icon(type)}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
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


// Match map tiles to the current theme
export function setMapTheme() {
    if (!map) return;
    if (tileLayer) map.removeLayer(tileLayer);

    tileLayer = L.tileLayer(getTileUrl(), {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19
    }).addTo(map);
}
