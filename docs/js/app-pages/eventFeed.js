/**
 * eventFeed.js
 * Handles loading event feed
 */


import { API, attachMapButton, safeJson } from "../utils.js";
import { openEvent } from "./eventPage.js";
import { openProfile } from "./profile.js";


const ASSET_BASE = "https://campus-pulse-worker.vindictivity.workers.dev/assets/";


export async function loadEvents() {
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
        const eventsContainer = document.getElementById("event-cards-container");
        if (!eventsContainer) return;

        eventsContainer.innerHTML = "";

        // Create a card for each event
        const fragment = document.createDocumentFragment();
        events.forEach((event, index) => {
            const card = createEventCard(event);
            const baseDelay = index * 0.360;
            card.style.animationDelay = `${baseDelay}s`;
            card.style.setProperty("--card-delay", `${baseDelay}s`);
            fragment.appendChild(card);
        });

        eventsContainer.appendChild(fragment);
    } catch (err) {
        console.error("Failed to load events:", err);
    }
}


// Create an event card
function createEventCard(event) {
    const card = document.createElement("div");
    card.className = "event-card";

    const type = (event.type || "club").toLowerCase();
    card.classList.add(`${type}-event`);

    // Event image
    const imageWrapper = createImageSection(event);

    // Event content
    const content = document.createElement("div");
    content.className = "event-card-content";
    content.append(
        createTitle(event),
        createMeta(event),
        createBreak(),
        createAuthor(event),
        createDescription(event),
        createTags(event),
        createActions(event)
    );

    card.append(imageWrapper, content);
    return card;
}


// Generate event card image wrapper
function createImageSection(event) {
    const wrapper = document.createElement("div");
    wrapper.className = "event-card-image-wrapper";

    const img = document.createElement("img");
    img.className = "event-card-image";
    img.src = event.image
        ? `${ASSET_BASE}${event.image}`
        : "assets/eventImages/default.png";
    img.alt = event.title;

    const badge = createDateBadge(event);
    wrapper.append(img, badge);
    return wrapper;
}


// Generate event card date badge
function createDateBadge(event) {
    const dateBadge = document.createElement("div");
    dateBadge.className = "event-card-date";

    const date = new Date(event.datetime * 1000)
    const month = document.createElement("span");
    month.className = "month";
    month.textContent = date.toLocaleString("default", { month: "short" }).toUpperCase();

    const day = document.createElement("span");
    day.className = "day";
    day.textContent = `${date.getDate()}`;

    dateBadge.append(month, day);
    return dateBadge;
}


// Generate event card title
function createTitle(event) {
    const title = document.createElement("h3");
    title.className = "event-card-title";
    title.textContent = event.title;
    return title;
}


// Generate event card meta
function createMeta(event) {
    const meta = document.createElement("div");
    meta.className = "event-card-meta";
    meta.innerHTML = `
        <span class="event-card-location">${event.location || "Unknown location"}</span>
        <span class="event-card-dot">•</span>
        <span class="event-card-meta-date">${formatDate(event.datetime)}</span>
    `;
    return meta;
}


// Generate event card break
function createBreak() {
    return document.createElement("br");
}


// Generate event card author
function createAuthor(event) {
    const author = document.createElement("div");
    author.className = "event-card-author";
    const userId = event.createdBy;
    const username = event.createdByUsername || "unknown";
    author.innerHTML = `
        Posted by 
        <span class="clickable-user" data-user-id="${event.createdBy}">
            @${username}
        </span>
    `;

    // Attach navigation
    author.querySelector(".clickable-user")?.addEventListener("click", (e) => {
        e.stopPropagation();
        openProfile(userId);
    });

    return author;
}


// Generate event card description
function createDescription(event) {
    const description = document.createElement("p");
    description.className = "event-card-description";
    const text = event.description || "";
    const maxLength = 200;
    if (text.length > maxLength) {
        description.textContent = text.slice(0, maxLength).trim() + "...";
    } else {
        description.textContent = text;
    }
    return description;
}


// Generate event card tags
function createTags(event) {
    const tags = document.createElement("div");
    tags.className = "event-card-tags";

    (event.tags || []).forEach(tag => {
        const bubble = document.createElement("span");
        bubble.className = "event-card-tag-bubble";
        bubble.textContent = toTitleCase(tag);
        tags.appendChild(bubble);
    });

    return tags;
}


// Generate event card buttons
function createActions(event) {
    const actions = document.createElement("div");
    actions.className = "event-card-actions";

    actions.append(
        createDetailsButton(event),
        createMapButton(event)
    );

    return actions;
}


// Generate event card details button
function createDetailsButton(event) {
    const detailsBtn = document.createElement("button");
    detailsBtn.className = "primary-button";
    detailsBtn.textContent = "See Details";

    detailsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openEvent(event.id);
    });

    return detailsBtn;
}


// Generate event card map button
function createMapButton(event) {
    const mapBtn = document.createElement("button");
    mapBtn.className = "tertiary-button";
    mapBtn.textContent = "Show on Map";

    // Add map button listeners
    if (mapBtn) {
        attachMapButton(event, mapBtn);
    }

    return mapBtn;
}


// Uppercase the first letter of each word
function toTitleCase(str) {
    return str.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}


// Format event datetime
function formatDate(timestamp) {
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
