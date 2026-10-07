/**
 * eventPage.js
 * Handles individual event pages
 */


import { API, ASSETS, attachMapButton, safeJson, showError, updateURL } from "../utils.js";
import { loadEvents } from "./eventFeed.js";
import { getCategoryKey, categoryChipHTML, formatFullDate, formatDayLabel, relativeStatus, escapeHTML } from "../categories.js";
import { icon } from "../icons.js";
import { openProfile } from "./profile.js";


export function openEvent(eventId) {
    if (!eventId) return;
    updateURL("event", eventId);
    const page = document.getElementById("event-page");
    if (page) page.scrollTop = 0;
    loadEventPage(eventId);
    animateEventPage();
}


// Generate an event from the given id
export async function loadEventPage(eventId) {
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

    const type = getCategoryKey(event.type);
    const title = escapeHTML(event.title || "Untitled Event");
    const location = escapeHTML(event.location || "Location TBA");
    const description = escapeHTML(event.description || "No description available.");
    const createdBy = escapeHTML(event.createdBy);
    const createdByUsername = escapeHTML(event.createdByUsername || "unknown");
    const canDelete = currentRole === "admin" || currentUser === event.createdBy;
    const status = relativeStatus(event.datetime);

    const hero = event.image
        ? `<img src="${ASSETS}${event.image}" alt="">`
        : `<div class="event-card-placeholder" data-cat="${type}">${icon(type)}</div>`;

    container.innerHTML = `
        <article class="event-page" data-cat="${type}">
            <!-- Hero Image -->
            <div class="event-page-hero">${hero}</div>

            <!-- Content -->
            <div class="event-page-content">
                <div class="event-card-top">
                    ${categoryChipHTML(type)}
                    ${status ? `<span class="event-status${status.live ? " is-live" : ""}">${status.live ? `<span class="live-dot"></span>` : ""}${status.label}</span>` : ""}
                </div>

                <h1 class="event-page-title">${title}</h1>

                <ul class="event-page-info">
                    <li>
                        <span class="info-icon">${icon("calendar")}</span>
                        <span><strong>${formatDayLabel(event.datetime)}</strong><small>${formatFullDate(event.datetime)}</small></span>
                    </li>
                    <li>
                        <span class="info-icon">${icon("pin")}</span>
                        <span><strong>${location}</strong></span>
                    </li>
                    <li>
                        <span class="info-icon">${icon("user")}</span>
                        <span><button class="clickable-user" data-user-id="${createdBy}" data-username="${createdByUsername}">@${createdByUsername}</button><small>Posted by</small></span>
                    </li>
                </ul>

                <div class="event-page-actions">
                    ${renderActionButtonHTML(event)}
                    ${createMapButtonHTML()}
                </div>

                <section class="event-page-section">
                    <h2>About</h2>
                    <p class="event-page-description">${description}</p>
                </section>

                ${renderTags(event.tags || [])}

                ${canDelete ? renderDeleteButton() : ""}
            </div>
        </article>
        `;

    // Fall back to the placeholder if the image fails
    const heroImg = container.querySelector(".event-page-hero img");
    heroImg?.addEventListener("error", () => {
        heroImg.parentElement.innerHTML = `<div class="event-card-placeholder" data-cat="${type}">${icon(type)}</div>`;
    }, { once: true });

    attachEventPageButtons(event, canDelete);
}


function renderTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return "";

    return `
        <div class="event-page-tags">
            ${tags.map(tag => `<span class="tag-chip">${escapeHTML(toTitleCase(tag))}</span>`).join("")}
        </div>
    `;
}


const ACTION_LABELS = {
    discord: "Join the Discord",
    instagram: "Open Instagram",
    contact: "Contact organizer",
    rsvp: "RSVP"
};


function renderActionButtonHTML(event) {
    const { action } = event;
    if (!action) return "";

    const label = action === "custom"
        ? escapeHTML(event.actionLabel || "Visit website")
        : ACTION_LABELS[action] || "Learn more";

    return `
        <button class="primary-button event-page-action-button" data-action="${escapeHTML(action)}">
            ${label}
        </button>
    `;
}


function renderDeleteButton() {
    return `
        <div class="event-page-delete-button-container">
            <button class="danger-button" id="delete-event-button">
                ${icon("trash")} Delete event
            </button>
        </div>
    `;
}


// Generate event card map button
function createMapButtonHTML() {
    const mapBtn = `
        <button class="secondary-button event-map-button">${icon("map")} Show on map</button>
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


function toTitleCase(str) {
    return str.split(" ").map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
    ).join(" ");
}

