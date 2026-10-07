/**
 * eventFeed.js
 * Handles loading event feed
 */


import { API, ASSETS, attachMapButton, safeJson, redirect } from "../utils.js";
import { CATEGORIES, getCategoryKey, categoryChipHTML, formatTime, formatDayLabel, relativeStatus, escapeHTML } from "../categories.js";
import { icon } from "../icons.js";
import { openEvent } from "./eventPage.js";
import { openProfile } from "./profile.js";


// Events stay visible for two hours after they start
const LIVE_WINDOW = 2 * 60 * 60;

let cachedEvents = [];
let activeFilter = "all";


export async function loadEvents() {
    const eventsContainer = document.getElementById("event-cards-container");
    if (!eventsContainer) return;

    if (cachedEvents.length === 0) renderSkeleton(eventsContainer);

    try {
        // Fetch list of events the user is interested in
        const eventsEndpoint = `${API}/get-events`
        const eventsResponse = await fetch(eventsEndpoint, {
            credentials: "include"
        });

        // Error fetching events
        if (!eventsResponse.ok) {
            renderEmptyState(eventsContainer, "network");
            return;
        }

        const data = await safeJson(eventsResponse);
        const events = data.events || data;
        cachedEvents = Array.isArray(events) ? events : [];
        renderFeed();
    } catch (err) {
        console.error("Failed to load events:", err);
        renderEmptyState(eventsContainer, "network");
    }
}


// Render the feed from the cached events (also used when the view mode changes)
export function renderFeed() {
    const container = document.getElementById("event-cards-container");
    if (!container) return;
    container.innerHTML = "";

    // No events found
    if (cachedEvents.length === 0) {
        renderEmptyState(container, "no-events");
        return;
    }

    const now = Date.now() / 1000;
    const sorted = [...cachedEvents].sort((a, b) => a.datetime - b.datetime);
    const upcoming = sorted.filter(event => event.datetime > now - LIVE_WINDOW);
    const past = sorted.filter(event => event.datetime <= now - LIVE_WINDOW).reverse();

    container.append(createHeader(upcoming.length), createFilters(sorted));

    const visible = list => list.filter(event =>
        activeFilter === "all" || getCategoryKey(event.type) === activeFilter
    );

    const feed = document.createElement("div");
    feed.className = "feed-groups";
    let index = 0;

    // Group upcoming events by day
    const groups = new Map();
    visible(upcoming).forEach(event => {
        const label = formatDayLabel(event.datetime);
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push(event);
    });

    groups.forEach((events, label) => {
        feed.appendChild(createGroup(label, events, () => index++));
    });

    const visiblePast = visible(past);
    if (visiblePast.length > 0) {
        feed.appendChild(createGroup("Past events", visiblePast, () => index++, true));
    }

    if (index === 0) {
        feed.appendChild(createFilteredEmpty());
    }

    container.appendChild(feed);
}


function createHeader(count) {
    const header = document.createElement("header");
    header.className = "page-header feed-header";
    header.innerHTML = `
        <div>
            <p class="page-eyebrow">${count} upcoming</p>
            <h1 class="page-title">What's happening</h1>
        </div>
    `;
    return header;
}


// Category filters, only for categories present in the feed
function createFilters(events) {
    const present = new Set(events.map(event => getCategoryKey(event.type)));
    const row = document.createElement("div");
    row.className = "feed-filters";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Filter by category");

    const makeChip = (key, label, iconName) => {
        const chip = document.createElement("button");
        chip.className = "chip";
        chip.setAttribute("aria-pressed", String(activeFilter === key));
        if (key !== "all") chip.dataset.cat = key;
        chip.innerHTML = `${iconName ? icon(iconName) : ""}<span>${label}</span>`;
        chip.addEventListener("click", () => {
            activeFilter = activeFilter === key ? "all" : key;
            renderFeed();
        });
        return chip;
    };

    row.appendChild(makeChip("all", "All"));
    Object.entries(CATEGORIES).forEach(([key, { label }]) => {
        if (present.has(key)) row.appendChild(makeChip(key, label, key));
    });

    return row;
}


function createGroup(label, events, nextIndex, isPast = false) {
    const group = document.createElement("section");
    group.className = `feed-group${isPast ? " is-past" : ""}`;

    const heading = document.createElement("h2");
    heading.className = "feed-day";
    heading.textContent = label;

    const grid = document.createElement("div");
    grid.className = "feed-grid";
    events.forEach(event => {
        const card = createEventCard(event);
        card.style.setProperty("--card-delay", `${Math.min(nextIndex() * 0.04, 0.32)}s`);
        grid.appendChild(card);
    });

    group.append(heading, grid);
    return group;
}


function renderSkeleton(container) {
    container.innerHTML = `
        <div class="feed-skeleton" aria-hidden="true">
            <div class="skeleton" style="height: 28px; width: 50%"></div>
            <div class="skeleton" style="height: 260px"></div>
            <div class="skeleton" style="height: 260px"></div>
        </div>
    `;
}


function renderEmptyState(container, type) {
    container.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "empty-state";

    if (type === "network") {
        empty.innerHTML = `
            ${icon("alert")}
            <h3>Couldn't load events</h3>
            <p>Check your connection and try again.</p>
            <button class="secondary-button" id="retry-events">Try again</button>
        `;
        empty.querySelector("#retry-events").addEventListener("click", loadEvents);
    } else {
        empty.innerHTML = `
            ${icon("calendar")}
            <h3>Nothing on your radar yet</h3>
            <p>Add more interests to discover events around campus.</p>
            <button class="primary-button" id="go-to-interests">Update interests</button>
        `;
        empty.querySelector("#go-to-interests").addEventListener("click", () => {
            redirect("interests.html");
        });
    }

    container.appendChild(empty);
}


function createFilteredEmpty() {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
        ${icon("calendar")}
        <h3>No ${CATEGORIES[activeFilter]?.label.toLowerCase() || ""} events</h3>
        <p>Try another category.</p>
        <button class="secondary-button">Show all events</button>
    `;
    empty.querySelector("button").addEventListener("click", () => {
        activeFilter = "all";
        renderFeed();
    });
    return empty;
}


// Create an event card
function createEventCard(event) {
    const type = getCategoryKey(event.type);
    const title = escapeHTML(event.title || "Untitled event");
    const location = escapeHTML(event.location || "Location TBA");
    const status = relativeStatus(event.datetime);

    const card = document.createElement("article");
    card.className = `event-card ${type}-event`;
    card.dataset.cat = type;

    card.innerHTML = `
        <div class="event-card-media">${createMedia(event, type)}</div>
        <div class="event-card-body">
            <div class="event-card-top">
                ${categoryChipHTML(type)}
                ${status ? `<span class="event-status${status.live ? " is-live" : ""}">${status.live ? `<span class="live-dot"></span>` : ""}${status.label}</span>` : ""}
            </div>
            <h3 class="event-card-title">
                <a class="event-card-link" href="#event/${encodeURIComponent(event.id)}">${title}</a>
            </h3>
            <ul class="event-card-info">
                <li>${icon("calendar")}<span>${formatTime(event.datetime)}</span></li>
                <li>${icon("pin")}<span>${location}</span></li>
            </ul>
            <p class="event-card-description">${escapeHTML(event.description || "")}</p>
            <div class="event-card-footer">
                <button class="event-card-author">@${escapeHTML(event.createdByUsername || "unknown")}</button>
                <button class="icon-button event-card-map" aria-label="Show ${title} on map" title="Show on map">${icon("map")}</button>
            </div>
        </div>
    `;

    // Whole card opens the event
    card.querySelector(".event-card-link").addEventListener("click", (e) => {
        e.preventDefault();
        openEvent(event.id);
    });

    // Author opens their profile
    card.querySelector(".event-card-author").addEventListener("click", (e) => {
        e.stopPropagation();
        openProfile(event.createdByUsername || "unknown", event.createdBy);
    });

    // Map button
    attachMapButton(event, card.querySelector(".event-card-map"));

    // Fall back to the placeholder if the image fails
    const img = card.querySelector(".event-card-media img");
    img?.addEventListener("error", () => {
        img.parentElement.innerHTML = placeholderHTML(type);
    }, { once: true });

    return card;
}


function createMedia(event, type) {
    if (!event.image) return placeholderHTML(type);
    return `<img src="${ASSETS}${event.image}" alt="" loading="lazy">`;
}


function placeholderHTML(type) {
    return `<div class="event-card-placeholder" data-cat="${type}">${icon(type)}</div>`;
}
