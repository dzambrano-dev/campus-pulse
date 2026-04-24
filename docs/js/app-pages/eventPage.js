/**
 * eventPage.js
 * Handles individual event pages
 */


import { API, safeJson, showError } from "../utils.js";


// Generate an event from the given id
export async function loadEventPage(id) {
    const eventPageError = document.getElementById("event-page-error");
    if (!id) {
        showError(eventPageError, "No event ID");
        return;
    }

    const container = document.getElementById("event-page-container");
    if (!container) return;
    container.innerHTML = "";

    try {
        const endpoint = `${API}/get-event?id=${id}`;
        const response = await fetch(endpoint, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            const message = response.status === 404 ? "Event not found" : "Failed to load event"
            showError(eventPageError, message);
            return;
        }

        const event = await safeJson(response);
        if (!event) {
            showError(eventPageError, "Event not found");
            return;
        }

        renderEvent(event);
    } catch (error) {
        console.error("Failed to load event:", error);
        showError(eventPageError, "Failed to load event");
    }
}


function renderEvent(event) {
    const container = document.getElementById("event-page-container");
    if (!container) return;

    const title = event.title || "Untitled Event";
    const image = event.image || event.imageUrl || "assets/eventImages/default.png";
    const location = event.location || "Unknown";
    const createdBy = event.createdBy || "unknown";
    const description = event.description || "No description available.";

    container.innerHTML = `
        <!-- Hero Image -->
        <div class="event-page-hero">
            <img src="${image}" alt="${title}">
        </div>
        
        <!-- Content -->
        <div class="event-page-content">

            <h1 class="event-page-title">${title}</h1>
            <div class="event-page-meta">
                <span class="event-page-location">${location}</span>
                <span class="event-page-dot">•</span>
                <span class="event-page-date">${formatDate(event.datetime)}</span>
            </div>

            <div class="event-page-author">
                Posted by <span>@${createdBy}</span>
            </div>

            <p class="event-page-description">
                ${description}
            </p>

            ${renderTags(event.tags || [])}
        </div>
        `;
}



function renderTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return "";

    return `
        <div class="event-page-tags">
            ${tags.map(tag =>
        `<span class="event-page-tag-bubble">${toTitleCase(tag)}</span>`
    ).join("")}
        </div>
    `;
}


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


function toTitleCase(str) {
    return str.split(" ").map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
    ).join(" ");
}

