/**
 * eventPage.js
 * Handles individual event pages
 */


import { API, attachMapButton, safeJson, showError } from "../utils.js";


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
            
            <div class="event-page-actions">
                ${renderActionButtonHTML(event)}
                ${createMapButtonHTML()}
            </div>
        </div>
        `;
    attachEventPageButtons(event);
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


function renderActionButtonHTML(event) {
    const { action } = event;

    if (!action) return `<div class="event-page-action-spacer"></div>`;

    let label = "";
    let color = "";

    switch (action) {
        case "discord":
            label = "Discord";
            color = "#5865F2";
            break;
        case "instagram":
            label = "Instagram";
            color = "#22d3ee";
            break;
        case "contact":
            label = "Contact";
            color = "#22c55e";
            break;
        case "custom":
            label = event.actionLabel || "Website";
            color = "#1e3a8a";
            break;
        case "rsvp":
            label = "RSVP";
            color = "#f97316";
            break;
    }

    const actionBtn = `
        <button class="primary-button event-page-action-button" data-action="${action}" style="background:${color}">
            ${label}
        </button>
    `;

    return actionBtn;
}


// Generate event card map button
function createMapButtonHTML() {
    const mapBtn = `
        <button class="tertiary-button event-map-button">Show on Map</button>
    `
    return mapBtn;
}


function attachEventPageButtons(event) {
    // Map button
    const mapBtn = document.querySelector(".event-map-button");
    if (mapBtn) {
        attachMapButton(event, mapBtn);
    }

    // ACTION BUTTON
    const actionBtn = document.querySelector(".event-page-action-button");
    if (actionBtn) {
        actionBtn.addEventListener("click", () => {
            const action = actionBtn.dataset.action;

            if (action === "rsvp") return;

            let link = event.actionLink;

            if (action === "contact") {
                link = `mailto:${link}`;
            }

            if (link) {
                window.open(link, "_blank");
            }
        });
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


function toTitleCase(str) {
    return str.split(" ").map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
    ).join(" ");
}

