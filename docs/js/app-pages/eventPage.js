/**
 * eventPage.js
 * Handles individual event pages
 */


import { API, safeJson } from "../utils.js";


// Generate an event from the given id
export async function loadEventPage(id) {
    if (!id) {
        showError("No event ID");
        return;
    }

    const container = document.getElementById("event-container");
    if (!container) return;
    container.innerHTML = "";

    try {
        const endpoint = `${API}/event?id=${id}`;
        const response = await fetch(endpoint, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            showError(response.status === 404 ? "Event not found" : "Failed to load event");
            return;
        }

        const event = await safeJson(response);
        if (!event) {
            showError("Event not found");
            return;
        }

        renderEvent(event);
    } catch (error) {
        console.error("Failed to load event:", error);
        showError("Failed to load event");
    }
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


function renderEvent(event) {
    const container = document.getElementById("event-container");
    if (!container) return;

    const title = event.title || "Untitled Event";
    const image = event.image || event.imageUrl || "assets/eventImages/default.png";
    const location = event.location || "Unknown";
    const createdBy = event.createdBy || "unknown";
    const description = event.description || "No description available.";

    container.innerHTML = `
        <div class="event-detail-card">
            <img src="${image}" alt="${title}" class="event-detail-image">
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
            </div>
        </div>
    `;
}


function showError(message) {
    const container = document.getElementById("event-container");

    if (!container) return;

    container.innerHTML = `
        <div class="event-error">
            <h2>${message}</h2>
        </div>
    `;
}


function toTitleCase(str) {
    return str.split(" ").map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
    ).join(" ");
}

