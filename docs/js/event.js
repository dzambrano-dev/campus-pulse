import { API, safeJson } from "./utils.js";

/*
GET EVENT ID FROM URL
*/
function getEventId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        console.warn("No ID in URL");
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
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await safeJson(response);

        // Cloudflare APIs can vary → normalize
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.events)) return data.events;
        if (Array.isArray(data.data)) return data.data;

        console.error("Unexpected API format:", data);
        return null;

    } catch (err) {
        console.error("Fetch failed:", err);
        return null;
    }
}

/*
 
FIND EVENT (STRICT MATCH ONLY)
 
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
RENDER EVENT
*/
function renderEvent(event) {
    const container = document.getElementById("event-container");

    // Safe defaults
    const title = event.title || "Untitled Event";
    const description = event.description || "No description available.";
    const location = event.location || "Unknown location";
    const createdBy = event.createdBy || "unknown";

    const image =
        event.image ||
        event.imageUrl ||
        "assets/eventImages/default.png";

    // Handle multiple datetime formats
    let formattedDate = "Date not available";

    if (event.datetime) {
        if (typeof event.datetime === "number") {
            // assume UNIX seconds
            formattedDate = new Date(event.datetime * 1000).toLocaleString();
        } else {
            // assume ISO string
            formattedDate = new Date(event.datetime).toLocaleString();
        }
    }
    const tags = Array.isArray(event.tags) ? event.tags : [];

    container.innerHTML = `
        <div class="event-detail-card">

            <img src="${image}" class="event-detail-image"/>

            <h1>${title}</h1>

            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Posted by:</strong> @${createdBy}</p>

            <p class="event-description">${description}</p>

            <div class="event-tags">
                ${tags.map(tag =>
                    `<span class="tag-bubble">${toTitleCase(tag)}</span>`
                ).join("")}
            </div>

            ${renderDiscord(event)}

        </div>
    `;
}

/*
DISCORD BUTTON
*/
function renderDiscord(event) {
    if (!event.discord) return "";

    return `
        <a href="${event.discord}" target="_blank" class="discord-button">
            Join Discord
        </a>
    `;
}

/*
ERROR HANDLING
*/
function showError(message) {
    const container = document.getElementById("event-container");

    container.innerHTML = `
        <div style="padding: 40px; text-align: center;">
            <h2>${message}</h2>
            <a href="app.html">← Back to Feed</a>
        </div>
    `;
}

/*
HELPER
*/
function toTitleCase(str) {
    return str
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

/*
INIT
*/
async function loadEvent() {
    const id = getEventId();

    console.log("EVENT ID:", id);

    if (!id) {
        showError("No event ID provided");
        return;
    }

    const events = await fetchEvents();

    console.log("EVENTS FROM API:", events);

    if (!events) {
        showError("Failed to load events");
        return;
    }

    const event = findEvent(events, id);

    console.log("MATCHED EVENT:", event);

    if (!event) {
        showError("Event not found");
        return;
    }

    renderEvent(event);
}

loadEvent();