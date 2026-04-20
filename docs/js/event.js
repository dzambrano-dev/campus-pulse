import { API, safeJson } from "./utils.js";

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
        const res = await fetch(`${API}/get-events`, {
            method: "GET",
            credentials: "include"
        });

        if (!res.ok) throw new Error(res.status);

        const data = await safeJson(res);

        if (Array.isArray(data)) return data;
        if (Array.isArray(data.events)) return data.events;
        if (Array.isArray(data.data)) return data.data;

        return null;
    } catch (err) {
        console.error("fetch failed", err);
        return null;
    }
}

// find event
function findEvent(events, id) {
    return events.find(e => {
        const eid = e.id || e.eventId || e._id || e.key || e.uuid;
        return String(eid) === String(id);
    });
}

// format date
function formatDate(dt) {
    if (!dt) return "Date not available";

    if (typeof dt === "number") {
        return new Date(dt * 1000).toLocaleString();
    }

    return new Date(dt).toLocaleString();
}

// discord button
function renderDiscord(event) {
    const link =
        event.discord ||
        discordLinks[event.id] ||
        discordLinks[event.title];

    if (!link) return "";

    return `
        <a href="${link}" target="_blank" rel="noopener noreferrer" class="discord-button">
            Join Discord
        </a>
    `;
}

// tags
function renderTags(tags) {
    if (!tags?.length) return "";

    return `
        <div class="event-tags">
            ${tags.map(t => `<span class="tag-bubble">${toTitleCase(t)}</span>`).join("")}
        </div>
    `;
}

// render page
function renderEvent(event) {
    const container = document.getElementById("event-container");

    const image = event.image || event.imageUrl || "assets/eventImages/default.png";

    container.innerHTML = `
        <div class="event-detail-card">

            <img src="${image}" class="event-detail-image"/>

            <div class="event-detail-content">

                <h1 class="event-title">${event.title || "Untitled Event"}</h1>

                <div class="event-meta">
                    <p><strong>Location:</strong> ${event.location || "Unknown"}</p>
                    <p><strong>Date:</strong> ${formatDate(event.datetime)}</p>
                    <p><strong>Posted by:</strong> @${event.createdBy || "unknown"}</p>
                </div>

                <p class="event-description">
                    ${event.description || "No description available."}
                </p>

                ${renderTags(event.tags || [])}

                ${renderDiscord(event)}

            </div>
        </div>
    `;
}

// error state
function showError(msg) {
    document.getElementById("event-container").innerHTML = `
        <div class="event-error">
            <h2>${msg}</h2>
            <a href="app.html">← Back</a>
        </div>
    `;
}

// helper
function toTitleCase(str) {
    return str.split(" ")
        .map(w => w[0].toUpperCase() + w.slice(1))
        .join(" ");
}

// init
async function loadEvent() {
    const id = getEventId();
    if (!id) return showError("No event ID");

    const events = await fetchEvents();
    if (!events) return showError("Failed to load events");

    const event = findEvent(events, id);
    if (!event) return showError("Event not found");

    renderEvent(event);
}

loadEvent();