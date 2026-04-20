import { API, safeJson } from "./utils.js";
import { API, safeJson } from "./utils.js";

const discordLinks = {
    "12": "https://discord.gg/cyberclub",
    "15": "https://discord.gg/chessclub"
};

const link = event.discord || discordLinks[event.id];

/*
GET EVENT ID FROM URL
*/
function getEventId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        console.warn("No ID found in URL");
        return null;
    }
    return id.trim();
}

/*
FETCH EVENTS FROM API
*/
async function fetchEvents() {
    try {
        const response = await fetch(`${API}/get-events`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await safeJson(response);

        // Normalize possible API shapes
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.events)) return data.events;
        if (Array.isArray(data.data)) return data.data;

        console.error("Unexpected API response:", data);
        return null;

    } catch (error) {
        console.error("Failed to fetch events:", error);
        return null;
    }
}
/*
FIND EVENT BY ID
*/
function findEvent(events, id) {
    if (!Array.isArray(events)) return null;

    return events.find(event => {
        const possibleId =
            event.id ||
            event.eventId ||
            event._id ||
            event.key ||
            event.uuid;

        return String(possibleId) === String(id);
    });
}


/*
FORMAT DATE
*/
function formatDate(datetime) {
    if (!datetime) return "Date not available";

    try {
        if (typeof datetime === "number") {
            return new Date(datetime * 1000).toLocaleString();
        }

        return new Date(datetime).toLocaleString();

    } catch {
        return "Date not available";
    }
}

/*
RENDER DISCORD BUTTON
*/
function renderDiscord(event) {
    const link =
        event.discord ||
        discordLinks[event.title];

    if (!link) return "";

    return `
        <a href="${link}"
           target="_blank"
           rel="noopener noreferrer"
           class="discord-button">
           Join Discord
        </a>
    `;
}

/*
RENDER TAGS
*/
function renderTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return "";

    return `
        <div class="event-tags">
            ${tags.map(tag =>
                `<span class="tag-bubble">${toTitleCase(tag)}</span>`
            ).join("")}
        </div>
    `;
}

/*
RENDER EVENT PAGE
*/
function renderEvent(event) {
    const container = document.getElementById("event-container");

    const title = event.title || "Untitled Event";
    const description = event.description || "No description available.";
    const location = event.location || "Unknown location";
    const createdBy = event.createdBy || "unknown";

    const image =
        event.image ||
        event.imageUrl ||
        "assets/eventImages/default.png";

    const formattedDate = formatDate(event.datetime);
    const tags = Array.isArray(event.tags) ? event.tags : [];

    container.innerHTML = `
        <div class="event-detail-card">

            <img 
                src="${image}" 
                alt="${title}"
                class="event-detail-image"
            >

            <div class="event-detail-content">

                <h1 class="event-title">${title}</h1>

                <div class="event-meta">
                    <p><strong>📍 Location:</strong> ${location}</p>
                    <p><strong>📅 Date:</strong> ${formattedDate}</p>
                    <p><strong>👤 Posted by:</strong> @${createdBy}</p>
                </div>

                <p class="event-description">
                    ${description}
                </p>

                ${renderTags(tags)}

                <div class="event-actions">
                    ${renderDiscord(event)}
                </div>

            </div>

        </div>
    `;
}

/*
SHOW ERROR
*/
function showError(message) {
    const container = document.getElementById("event-container");
    container.innerHTML = `
        <div class="event-error">
            <h2>${message}</h2>
            <a href="app.html" class="back-button">
                ← Back to Feed
            </a>
        </div>
    `;
}

/*
HELPER: TITLE CASE
*/
function toTitleCase(str) {
    return str
        .split(" ")
        .map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
        )
        .join(" ");
}

/*
INIT
*/
async function loadEvent() {
    const id = getEventId();

    if (!id) {
        showError("No event ID provided.");
        return;
    }

    const events = await fetchEvents();
    if (!events) {
        showError("Failed to load events.");
        return;
    }

    const event = findEvent(events, id);
    if (!event) {
        showError("Event not found.");
        return;
    }
    renderEvent(event);
}
loadEvent();