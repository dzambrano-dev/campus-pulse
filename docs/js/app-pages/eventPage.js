/**
 * eventPage.js
 * Handles individual event pages
 */


import { API, ASSETS, attachMapButton, safeJson, showError, updateURL } from "../utils.js";
import { loadEvents } from "./eventFeed.js";
import { openProfile } from "./profile.js";


export function openEvent(eventId) {
    if (!eventId) return;
    updateURL("event", eventId);
    animateEventPage();
    loadEventPage(eventId);
}


// Generate an event from the given id
async function loadEventPage(eventId) {
    const container = document.getElementById("event-page-container");
    const eventPageError = document.getElementById("event-page-error");
    if (!container) return;
    container.innerHTML = "";

    try {
        const endpoint = `${API}/get-event?id=${eventId}`;
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

        // Fetch user info
        const userResponse = await fetch(`${API}/user`, { credentials: "include" });
        const userData = await safeJson(userResponse);

        // Display event
        renderEvent(event, userData);
    } catch (error) {
        console.error("Failed to load event:", error);
        showError(eventPageError, "Failed to load event");
    }
}


function renderEvent(event, userData) {
    const container = document.getElementById("event-page-container");
    if (!container) return;

    const currentUser = userData?.username;
    const currentRole = userData?.role;

    const title = event.title || "Untitled Event";
    const image = event.image
        ? `${ASSETS}${event.image}`
        : "assets/eventImages/default.png";
    const location = event.location || "Unknown";
    const description = event.description || "No description available.";
    const createdBy = event.createdBy;
    const createdByUsername = event.createdByUsername || "unknown";
    const canDelete = currentRole === "admin" || currentUser === event.createdBy;

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
                <span class="event-page-meta-date">${formatDate(event.datetime)}</span>
            </div>
            <br>
            <div class="event-page-author">
                Posted by 
                <span class="clickable-user" data-user-id="${createdBy}" data-username="${createdByUsername}">
                @${createdByUsername}
                </span>
            </div>

            <p class="event-page-description">${description}</p>

            ${renderTags(event.tags || [])}
            
            <div class="event-page-actions">
                ${renderActionButtonHTML(event)}
                ${createMapButtonHTML()}
            </div>
        </div>
        
        ${canDelete ? renderDeleteButton() : ""}
        `;

    attachEventPageButtons(event, canDelete);
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


function renderDeleteButton() {
    return `
        <div class="event-page-delete-button-container">
            <button class="danger-button" id="delete-event-button">
                Delete Event
            </button>
        </div>
    `;
}


// Generate event card map button
function createMapButtonHTML() {
    const mapBtn = `
        <button class="tertiary-button event-map-button">Show on Map</button>
    `
    return mapBtn;
}


function attachEventPageButtons(event, canDelete) {
    // Map button
    const mapBtn = document.querySelector(".event-map-button");
    if (mapBtn) {
        attachMapButton(event, mapBtn);
    }

    // Action button
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

    // Profile click
    document.querySelectorAll(".clickable-user").forEach(el => {
        el.addEventListener("click", () => {
            const username = el.dataset.username;
            const userId = el.dataset.userId;
            openProfile(username, userId);
        });
    });

    // Delete
    if (canDelete) {
        const deleteBtn = document.getElementById("delete-event-button");
        deleteBtn.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to delete this event?")) return;

            try {
                const res = await fetch(`${API}/delete-event?id=${event.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });

                if (!res.ok) {
                    alert("Failed to delete event");
                    return;
                }

                // Go back to feed and reload events
                await loadEvents();
                updateURL("events");
                document.querySelector('[data-page="events-page"]')?.click();
            } catch {
                alert("Network error");
            }
        });
    }
}


// Trigger page change animation
function animateEventPage() {
    const eventPage = document.getElementById("event-page");
    const currentPage = document.querySelector(".app-page.active");

    if (!eventPage || currentPage === eventPage) return;

    eventPage.style.display = "block";

    if (currentPage) {
        currentPage.classList.remove("active");
        currentPage.classList.add("fade-out");
    }

    requestAnimationFrame(() => {
        eventPage.classList.add("active");
    });

    setTimeout(() => {
        if (currentPage) {
            currentPage.style.display = "none";
            currentPage.classList.remove("fade-out");
        }
    }, 250);
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

