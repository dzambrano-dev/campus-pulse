/**
 * eventCreation.js
 * Handles event creation UI and logic
 */


import { API, clearErrors, safeJson, setLoading, showError, convertToWebP, getTileUrl, TILE_ATTRIBUTION } from "../utils.js";
import { CATEGORIES } from "../categories.js";
import { icon } from "../icons.js";


let eventMap;
let eventMarker;
let tileLayer;


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
    creationButton.innerHTML = `${icon("create")}<span>Create</span>`;
    navBar.insertBefore(creationButton, navBar.children[1]);

    // Category picker options
    const typeOptions = Object.entries(CATEGORIES).map(([key, { label }]) => `
        <label class="type-option" data-cat="${key}">
            <input type="radio" name="event-type-option" value="${key}">
            ${icon(key)}<span>${label}</span>
        </label>
    `).join("");

    // Create the event creation page
    const creationPage = document.createElement("section");
    creationPage.className = "app-page";
    creationPage.id = "event-creation-page";
    creationPage.setAttribute("aria-label", "Create event");
    creationPage.innerHTML = `
        <div id="event-creation-container">
            <header class="page-header">
                <div>
                    <p class="page-eyebrow">Organizer</p>
                    <h1 class="page-title event-header">New event</h1>
                </div>
            </header>
            <form id="event-form" class="event-body" novalidate>
                <fieldset class="form-section">
                    <legend>Basics</legend>

                    <div class="field">
                        <label for="event-title">Title</label>
                        <input id="event-title" placeholder="What's happening?" required>
                    </div>

                    <div class="field">
                        <label for="event-description">Description <span class="field-hint">At least 50 characters</span></label>
                        <textarea id="event-description" placeholder="Tell people what to expect" maxlength="500" required></textarea>
                    </div>

                    <div class="field">
                        <span class="field-label" id="event-type-label">Category</span>
                        <div class="type-picker" role="radiogroup" aria-labelledby="event-type-label">${typeOptions}</div>
                        <input type="hidden" id="event-type" value="">
                    </div>
                </fieldset>

                <fieldset class="form-section">
                    <legend>When and where</legend>

                    <div class="field-row">
                        <div class="field">
                            <label for="event-date">Date</label>
                            <input type="date" id="event-date" required>
                        </div>
                        <div class="field">
                            <label for="event-time">Time</label>
                            <input type="time" id="event-time" required>
                        </div>
                    </div>

                    <div class="field">
                        <label for="event-location">Location</label>
                        <input id="event-location" placeholder="Building or room" required>
                    </div>

                    <div class="field">
                        <span class="field-label">Map pin <span class="field-hint">Tap the map to place it</span></span>
                        <div id="event-map" class="event-map"></div>
                    </div>
                </fieldset>

                <fieldset class="form-section">
                    <legend>Details</legend>

                    <div class="field">
                        <span class="field-label">Cover image</span>
                        <label class="image-drop" for="event-image">
                            <input type="file" id="event-image" accept="image/*">
                            <img class="image-drop-preview" alt="" hidden>
                            <span class="image-drop-empty">${icon("image")}<span>Choose an image</span></span>
                        </label>
                    </div>

                    <div class="field">
                        <span class="field-label">Tags <span class="field-hint">Pick up to 3</span></span>
                        <!-- Tags injected by JS -->
                        <div id="event-tags" class="tag-container"></div>
                    </div>

                    <div class="field">
                        <label for="call-to-action">Call to action</label>
                        <select id="call-to-action">
                            <option value="">None</option>
                            <option value="rsvp">RSVP</option>
                            <option value="contact">Contact</option>
                            <option value="discord">Discord</option>
                            <option value="instagram">Instagram</option>
                            <option value="custom">Custom link</option>
                        </select>
                    </div>

                    <!-- Dynamically shown -->
                    <div id="call-to-action-input-container">
                        <input id="event-action-label" placeholder="Button text (e.g. Learn more)" aria-label="Button text" style="display: none">
                        <input id="event-action-input" placeholder="" aria-label="Link" style="display: none">
                    </div>
                </fieldset>

                <!-- Error messages -->
                <div class="error" id="event-error" role="alert"></div>

                <!-- Action buttons -->
                <div class="event-actions">
                    <button type="reset" class="ghost-button">Clear</button>
                    <button type="submit" class="primary-button" id="submit-event-button">Publish event</button>
                </div>
            </form>
        </div>
    `;

    appContainer.insertBefore(creationPage, appContainer.children[1]);

    // Category picker writes to the hidden type field
    const typeField = creationPage.querySelector("#event-type");
    creationPage.querySelectorAll('input[name="event-type-option"]').forEach(radio => {
        radio.addEventListener("change", () => { typeField.value = radio.value; });
    });

    // Cover image preview
    const imageInput = creationPage.querySelector("#event-image");
    const imagePreview = creationPage.querySelector(".image-drop-preview");
    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];
        if (imagePreview.src) URL.revokeObjectURL(imagePreview.src);
        imagePreview.hidden = !file;
        imagePreview.closest(".image-drop").classList.toggle("has-image", Boolean(file));
        if (file) imagePreview.src = URL.createObjectURL(file);
    });

    const actionSelect = creationPage.querySelector("#call-to-action");
    const actionContainer = creationPage.querySelector("#call-to-action-input-container");
    const actionInput = creationPage.querySelector("#event-action-input");
    const actionLabel = creationPage.querySelector("#event-action-label");

    actionSelect.addEventListener("change", () => {
        const value = actionSelect.value;

        actionInput.value = "";
        actionLabel.value = "";

        actionInput.required = false;
        actionLabel.required = false

        actionInput.style.display = "none";
        actionLabel.style.display = "none";

        // None and RSVP show no extra fields
        if (!value || value === "rsvp") {
            return;
        }

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
            actionInput.placeholder = "Website link";
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

        // Clear category (hidden inputs keep their value on reset)
        typeField.value = "";

        // Clear image preview
        imagePreview.hidden = true;
        imagePreview.closest(".image-drop").classList.remove("has-image");

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

        // Reset call to action
        const actionSelect = creationPage.querySelector("#call-to-action");
        const actionInput = creationPage.querySelector("#event-action-input");
        const actionLabel = creationPage.querySelector("#event-action-label");

        actionSelect.value = "";
        actionInput.style.display = "none";
        actionLabel.style.display = "none";
        actionInput.required = false;
        actionLabel.required = false;
        actionInput.value = "";
        actionLabel.value = "";

        // Reset loading state
        const submitButton = creationPage.querySelector("#submit-event-button");
        setLoading(submitButton, false);
    });
}


// Refresh components
export function refreshEventCreationPage() {
    const creationPage = document.getElementById("event-creation-page");
    loadTags(creationPage);

    setTimeout(() => {
        initEventMap(creationPage);
    }, 50);
}


// Load a list of tags
async function loadTags(creationPage) {
    const interestsEndpoint = `${API}/get-interests`;
    const interestsResponse = await fetch(interestsEndpoint);
    const data = await interestsResponse.json();

    const tagContainer = creationPage.querySelector("#event-tags");
    tagContainer.innerHTML = "";

    data.interests.forEach(tag => {
        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("tag", "chip");
        button.setAttribute("aria-pressed", "false");
        button.textContent = String(tag);
        button.addEventListener("click", () => {
            const active = button.classList.toggle("active");
            button.setAttribute("aria-pressed", String(active));
        });
        tagContainer.appendChild(button);
    });
}


// Initialize map for pin placement
function initEventMap(creationPage) {
    const mapElement = creationPage.querySelector("#event-map");
    if (eventMap) eventMap.remove();
    eventMap = L.map(mapElement).setView([33.7838, -118.1141], 15);

    tileLayer = L.tileLayer(getTileUrl(), {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19
    }).addTo(eventMap);

    eventMarker = null;

    eventMap.on("click", event => {
        const { lat, lng } = event.latlng;
        if (eventMarker) {
            eventMarker.setLatLng([lat, lng]);
        } else {
            eventMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: "map-marker-wrapper",
                    html: `<div class="placement-pin"></div>`,
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                })
            }).addTo(eventMap);
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
    const imageFile = creationPage.querySelector("#event-image").files[0];

    // Validate data
    if (!title) return fail("Event title is required");
    if (description.length < 50) return fail("Description must be at least 50 characters");
    if (!type) return fail("Please select an event type");
    if (tags.length === 0) return fail("Please select at least one tag");
    if (tags.length > 3) return fail("You can select at most 3 tags");
    if (!location) return fail("Please provide a location");
    if (!date || !time) return fail("Date and time are required");
    if (!latlng) return fail("Please place a pin on the map");
    if (!imageFile) return fail("Event image is required");
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

    // Convert image to WebP
    const imageBase64 = await convertToWebP(imageFile);

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
        image: imageBase64
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


export function setEventCreationMapTheme() {
    if (!eventMap || !tileLayer) return;

    eventMap.removeLayer(tileLayer);

    tileLayer = L.tileLayer(getTileUrl(), {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19
    }).addTo(eventMap);
}
