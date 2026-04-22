import { API, safeJson } from "../utils.js";

const discordLinks = {
    "12": "https://discord.gg/cyberclub",
    "15": "https://discord.gg/chessclub",
    "Cybersecurity Capture the Flag": "https://discord.gg/cyberclub"
};

// get id from url
function getEventId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    return id ? id.trim() : null;
}

// fetch events
async function fetchEvents() {
    try {
        const response = await fetch(`${API}/get-events`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await safeJson(response);

        if (Array.isArray(data)) return data;
        if (Array.isArray(data.events)) return data.events;
        if (Array.isArray(data.data)) return data.data;

        return null;

    } catch (error) {
        console.error("fetch failed", error);
        return null;
    }
}

// find matching event
function findEvent(events, id) {
    if (!Array.isArray(events)) return null;

    return events.find(event => {
        const eventId =
            event.id ||
            event.eventId ||
            event._id ||
            event.key ||
            event.uuid;

        return String(eventId) === String(id);
    });
}

// format date
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

// discord button
function renderDiscord(event) {
    const link =
        event.discord ||
        discordLinks[String(event.id)] ||
        discordLinks[event.title];

    if (!link) return "";

    return `
        <a
            href="${link}"
            target="_blank"
            rel="noopener noreferrer"
            class="discord-button"
        >
            Discord Link
        </a>
    `;
}

// tags
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

// render event page
function renderEvent(event) {
    const container = document.getElementById("event-container");

    if (!container) return;

    const title = event.title || "Untitled Event";
    const image =
        event.image ||
        event.imageUrl ||
        "assets/eventImages/default.png";

    const location = event.location || "Unknown";
    const createdBy = event.createdBy || "unknown";
    const description =
        event.description || "No description available.";

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
                    <p><strong>Location:</strong> ${location}</p>
                    <p><strong>Date:</strong> ${formatDate(event.datetime)}</p>
                    <p><strong>Posted by:</strong> @${createdBy}</p>
                </div>

                <p class="event-description">
                    ${description}
                </p>

                ${renderTags(event.tags || [])}

                ${renderDiscord(event)}

            </div>

        </div>
    `;
}

// error message
function showError(message) {
    const container = document.getElementById("event-container");

    if (!container) return;

    container.innerHTML = `
        <div class="event-error">
            <h2>${message}</h2>
            <a href="app.html" class="back-btn">← Back</a>
        </div>
    `;
}

// helper
function toTitleCase(str) {
    return str
        .split(" ")
        .map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
        )
        .join(" ");
}

// init
async function loadEvent() {
    const id = getEventId();

    if (!id) {
        showError("No event ID");
        return;
    }

    const events = await fetchEvents();

    if (!events) {
        showError("Failed to load events");
        return;
    }

    const event = findEvent(events, id);

    if (!event) {
        showError("Event not found");
        return;
    }

    renderEvent(event);
}

loadEvent();