import { API, safeJson } from "./utils.js";

/*
GET EVENT ID FROM URL
*/
function getEventId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

/*
LOAD EVENT
*/
async function loadEvent() {
    const id = getEventId();

    console.log("EVENT PAGE ID:", id);

    if (id === null) {
        showError("No event ID provided");
        return;
    }

    try {
        // Fetch all events
        const response = await fetch(`${API}/get-events`, {
            credentials: "include"
        });

        if (!response.ok) {
            showError("Failed to fetch events");
            return;
        }

        const data = await safeJson(response);
        const events = data.events || data;

        if (!Array.isArray(events)) {
            console.error("Invalid events format:", events);
            showError("Invalid data received");
            return;
        }

        console.log("ALL EVENTS:", events);

        /*
        FIND EVENT
        */

        let event = null;

        // Try index-based
        if (!isNaN(id)) {
            event = events[Number(id)];
        }

        // Fallback: try real ID match
        if (!event) {
            event = events.find(e => {
                const possibleId = e.id || e.eventId || e._id || e.key;
                return String(possibleId) === String(id);
            });
        }

        if (!event) {
            showError("Event not found");
            return;
        }

        renderEvent(event);

    } catch (err) {
        console.error("Event load failed:", err);
        showError("Something went wrong loading the event");
    }
}

/*
RENDER EVENT
*/
function renderEvent(event) {
    const container = document.getElementById("event-container");

    // safe defaults
    const title = event.title || "Untitled Event";
    const description = event.description || "No description available.";
    const location = event.location || "Unknown location";
    const createdBy = event.createdBy || "unknown";
    const image = event.image || "assets/eventImages/default.png";

    // date formatting
    let formattedDate = "Date not available";
    if (event.datetime) {
        const date = new Date(event.datetime * 1000);
        formattedDate = date.toLocaleString();
    }

    container.innerHTML = `
        <div class="event-detail-card">

            <img src="${image}" class="event-detail-image"/>

            <h1>${title}</h1>

            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Posted by:</strong> @${createdBy}</p>

            <p class="event-description">${description}</p>

            <div class="event-tags">
                ${(event.tags || []).map(tag =>
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
HELPER: TITLE CASE
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
loadEvent();