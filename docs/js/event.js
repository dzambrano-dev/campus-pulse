import { API, safeJson } from "./utils.js";

// Get ID from URL
function getEventId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function loadEvent() {
    const id = getEventId();

    console.log("Event ID:", id);

    if (!id) {
        showError("No event ID provided");
        return;
    }

    try {
        const response = await fetch(`${API}/get-event?id=${id}`, {
            credentials: "include"
        });

        if (!response.ok) {
            showError("Event not found");
            return;
        }

        const event = await safeJson(response);

        console.log("Loaded event:", event);

        renderEvent(event);

    } catch (err) {
        console.error(err);
        showError("Failed to load event");
    }
}

function renderEvent(event) {
    const container = document.getElementById("event-container");

    const date = new Date(event.datetime * 1000);

    container.innerHTML = `
        <div class="event-detail-card">

            <img src="${event.image || 'assets/eventImages/default.png'}" class="event-detail-image"/>

            <h1>${event.title}</h1>

            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Date:</strong> ${date.toLocaleString()}</p>
            <p><strong>Posted by:</strong> @${event.createdBy}</p>

            <p>${event.description}</p>

            <div class="tags">
                ${(event.tags || []).map(tag => `<span class="tag">${tag}</span>`).join("")}
            </div>

            ${event.discord ? `
                <a href="${event.discord}" target="_blank" class="discord-button">
                    Join Discord
                </a>
            ` : ""}

        </div>
    `;
}

function showError(message) {
    document.getElementById("event-container").innerHTML = `
        <h2>${message}</h2>
    `;
}

loadEvent();