/**
 * eventCreation.js
 * Handles event creation UI and logic
 */


import { API, clearErrors, safeJson, setLoading, showError } from "../utils.js";


let eventMap;
let eventMarker;

const calendarSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M19 4h-2V2h-2v2H9V2H7v2H5c-1.1 0-2 .9-2 2v1h18V6c0-1.1-.9-2-2-2M3 20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8H3zm5-6h3v-3h2v3h3v2h-3v3h-2v-3H8z"></path></svg>`


// Initialize event creation feature
export function initEventCreation({ currentRole, loadEvents }) {
    if (!["organizer", "admin"].includes(currentRole)) return;

    const navBar = document.querySelector(".navigation-bar");
    const appContainer = document.querySelector(".app-container");
    if (!navBar || !appContainer) return;

    // Create the nav button
    const creationButton = document.createElement("button");
    creationButton.className = "nav-button";
    creationButton.dataset.page = "event-creation-page";
    creationButton.innerHTML = calendarSVG;
    navBar.insertBefore(creationButton, navBar.children[1]);

    // Create the event creation page
    const creationPage = document.createElement("section");
    creationPage.className = "app-page";
    creationPage.id = "event-creation-page";
    creationPage.innerHTML = `
        <div id="event-creation-container">
            <h2 class="event-header">Create an Event</h2>
            <form id="event-form" class="event-body">
                <input id="event-title" placeholder="Event Title" required>
                <textarea id="event-description" placeholder="Description" maxlength="500" required></textarea>

                <!-- Event Type -->
                <label>Event Type</label>
                <select id="event-type" required>
                    <option value="" disabled selected>Select event type</option>
                    <option value="alert">Alert</option>
                    <option value="academics">Academics</option>
                    <option value="athletics">Athletics</option>
                    <option value="career">Career</option>
                    <option value="club">Club</option>
                    <option value="social">Social</option>
                </select>

                <label>Tags</label>
                <!-- Tags injected by JS -->
                <div id="event-tags" class="tag-container"></div>

                <!-- Date -->
                <label>Date</label>
                <input type="date" id="event-date" required>

                <!-- Time & Location -->
                <label>Time</label>
                <input type="time" id="event-time" required>
                <input id="event-location" placeholder="Location" required>
                
                <!-- Call-to-action button select -->
                <label>Call to Action</label>
                <select id="call-to-action">
                    <option value="">None</option>
                    <option value="rsvp">RSVP</option>
                    <option value="contact">Contact</option>
                    <option value="discord">Discord</option>
                    <option value="instagram">Instagram</option>
                    <option value="custom">Custom Link</option>
                </select>
                
                <!-- Dynamically shown -->
                <div id="call-to-action-input-container" style="display: none;">
                    <input id="event-action-label" placeholder="Button text (e.g. Learn More)" style="display: none">
                    <input id="event-action-input" placeholder="">
                </div>
                
                <!-- Map pin -->
                <label>Click map to place a pin</label>
                <div id="event-map" class="event-map"></div>

                <!-- Upload event image -->
                <label>Event Image</label>
                <input type="file" id="event-image" accept="image/*">

                <!-- Error messages -->
                <div class="error" id="event-error"></div>

                <!-- Action buttons -->
                <div class="event-actions">
                    <button type="submit" class="primary-button" id="submit-event-button">Create</button>
                    <button type="reset" class="secondary-button">Reset</button>
                </div>
            </form>
        </div>
    `;

    appContainer.insertBefore(creationPage, appContainer.children[1]);

    const actionSelect = creationPage.querySelector("#call-to-action");
    const actionContainer = creationPage.querySelector("#call-to-action-input-container");
    const actionInput = creationPage.querySelector("#event-action-input");
    const actionLabel = creationPage.querySelector("#event-action-label");

    actionSelect.addEventListener("change", () => {
        const value = actionSelect.value;

        // Reset
        actionContainer.style.display = "none";
        actionInput.style.display = "none";
        actionLabel.style.display = "none";

        actionInput.value = "";
        actionLabel.value = "";
        actionInput.required = false;
        actionLabel.required = false

        if (!value || value === "rsvp") {
            return;
        }

        // Show container
        actionContainer.style.display = "block";
        actionContainer.classList.add("active");

        // Show link input for all except RSVP
        actionInput.style.display = "block";
        actionInput.required = true;

        // Placeholder changes
        if (value === "contact") {
            actionInput.placeholder = "Email address";
        } else if (value === "discord") {
            actionInput.placeholder = "Discord invite link";
        } else if (value === "instagram") {
            actionInput.placeholder = "Instagram link";
        } else {
            actionInput.placeholder = "https://example.com";
        }

        // Custom button gets a label
        if (value === "custom") {
            actionLabel.style.display = "block";
            actionLabel.required = true;
        }
    });

    // Page load
    let mapInitialized = false;

    creationButton.addEventListener("click", () => {
        loadTags(creationPage);
        if (!mapInitialized) {
            setTimeout(() => {
                initEventMap(creationPage);
                mapInitialized = true;
            }, 50);
        }
    });

    // Form submission
    const form = creationPage.querySelector("#event-form");
    form.addEventListener("submit", (event) => {
        submitEvent(event, creationPage, loadEvents)
    });

    // Form reset
    form.addEventListener("reset", () => {
        // Clear errors
        const eventError = creationPage.querySelector("#event-error");
        clearErrors(eventError);

        // Clear tags
        const activeTags = creationPage.querySelectorAll(".tag.active");
        activeTags.forEach((tag) => tag.classList.remove("active"));

        // Reset map marker
        if (eventMarker && eventMap) {
            eventMap.removeLayer(eventMarker);
            eventMarker = null;
        }

        // Reset map view
        if (eventMap) {
            eventMap.setView([33.7838, -118.1141], 15);
        }

        // Reset loading state
        const submitButton = creationPage.querySelector("#submit-event-button");
        setLoading(submitButton, false);
    });
}


// Load a list of tags
async function loadTags(creationPage) {
    const interestsEndpoint = `${API}/get-interests`;
    const interestsResponse = await fetch(interestsEndpoint);
    const data = await interestsResponse.json();

    const tagContainer = creationPage.querySelector("#event-tags");
    tagContainer.innerHTML = "";

    data.interests.forEach(tag => {
        const button = document.createElement("div");
        button.classList.add("tag");
        button.textContent = String(tag);
        button.addEventListener("click", () => {
            button.classList.toggle("active");
        });
        tagContainer.appendChild(button);
    });
}


// Initialize map for pin placement
function initEventMap(creationPage) {
    const mapElement = creationPage.querySelector("#event-map");
    if (eventMap) eventMap.remove();
    eventMap = L.map(mapElement).setView([33.7838, -118.1141], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(eventMap);

    eventMarker = null;

    eventMap.on("click", event => {
        const { lat, lng } = event.latlng;
        if (eventMarker) {
            eventMarker.setLatLng([lat, lng]);
        } else {
            eventMarker = L.marker([lat, lng]).addTo(eventMap);
        }
    });
}


// Submit the event to API
async function submitEvent(event, creationPage, loadEvents) {
    event.preventDefault();

    // Clear errors
    const eventError = creationPage.querySelector("#event-error");
    clearErrors(eventError);

    // Disable button
    const submitButton = creationPage.querySelector("#submit-event-button");
    setLoading(submitButton, true);

    // Organize data
    const title = creationPage.querySelector("#event-title").value;
    const description = creationPage.querySelector("#event-description").value;
    const type = creationPage.querySelector("#event-type").value;
    const tags = [...creationPage.querySelectorAll(".tag.active")].map(t => t.textContent);
    const date = creationPage.querySelector("#event-date").value;
    const time = creationPage.querySelector("#event-time").value;
    const location = creationPage.querySelector("#event-location").value;
    const action = creationPage.querySelector("#call-to-action").value || null;
    const rawLink = creationPage.querySelector("#event-action-input").value;
    const rawLabel = creationPage.querySelector("#event-action-label").value;
    const latlng = eventMarker ? eventMarker.getLatLng() : null;

    // Validate data
    if (!title) return fail("Event title is required");
    if (description.length < 50) return fail("Description must be at least 50 characters");
    if (!type) return fail("Please select an event type");
    if (tags.length === 0) return fail("Please select at least one tag");
    if (tags.length > 3) return fail("You can select at most 3 tags");
    if (!location) return fail("Please provide a location");
    if (!date || !time) return fail("Date and time are required");
    if (!latlng) return fail("Please place a pin on the map");
    let actionLink = null; let actionLabel = null;
    if (action) {
        if (action !== "rsvp") {
            if (!rawLink) return fail("Please provide a link");
            actionLink = rawLink.trim();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (action === "contact" && !emailRegex.test(actionLink)) {
                return fail("Enter a valid email");
            }

            if (["discord", "instagram", "custom"].includes(action)) {
                if (!actionLink.startsWith("http")) {
                    actionLink = `https://${actionLink}`;
                }
            }
        }

        if (action === "custom") {
            if (!rawLabel) return fail("Please provide a button label");
            actionLabel = rawLabel.trim();
        }
    }

    // Convert datetime
    const timestamp = Math.floor(new Date(`${date}T${time}`).getTime() / 1000);

    // Build event object
    const eventObject = {
        title: title,
        description: description,
        type: type,
        tags: tags,
        datetime: timestamp,
        location: location,
        action: action || null,
        actionLink: actionLink,
        actionLabel: action === "custom" ? actionLabel : null,
        lat: latlng.lat,
        lng: latlng.lng,
        image: null,
    };

    try {
        const createEventEndpoint = `${API}/create-event`;
        const response = await fetch(createEventEndpoint, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventObject)
        });

        const result = await safeJson(response);

        if (!response.ok) return fail(result.error || "Failed to create event");

        // Reset form and navigate back to events
        creationPage.querySelector("#event-form").reset();
        document.querySelector('[data-page="events-page"]').click();
        await loadEvents();
    } catch (err) {
        fail("Network error, please try again");
    }

    function fail(message) {
        showError(eventError, message);
        setLoading(submitButton, false);
    }
}
