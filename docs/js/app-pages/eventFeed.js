
// Load events from API
import { API, safeJson } from "../utils";


export async function loadEvents() {
    try {
        // Fetch list of events the user is interested in
        const eventsEndpoint = `${API}/get-events`
        const eventsResponse = await fetch(eventsEndpoint, {
            credentials: "include"
        });

        // If no events are found, return
        if (!eventsResponse.ok) return;

        const data = await safeJson(eventsResponse);
        const events = data.events || data;

        if (!Array.isArray(events)) {
            console.error("Events is not an array:", events);
            return;
        }

        // Clear events container
        const eventsContainer = document.getElementById("events-container");
        if (!eventsContainer) return;

        eventsContainer.innerHTML = "";

        // Create a card for each event
        const fragment = document.createDocumentFragment();
        events.forEach(event => {
            fragment.appendChild(createEventCard(event));
        });

        eventsContainer.appendChild(fragment);
    } catch (err) {
        console.error("Failed to load events:", err);
    }
}

// Create an event card
function createEventCard(event) {
    const card = document.createElement("div");
    card.className = "event-card";

    const type = (event.type || "club").toLowerCase();
    card.classList.add(`${type}-event`);

    // Event image
    const imageWrapper = createImageSection(event);

    // Event content
    const content = document.createElement("div");
    content.className = "event-content";

    content.append(
        createTitle(event),
        createMeta(event),
        createAuthor(event),
        createDescription(event),
        createTags(event),
        createActions(event)
    );

    card.append(imageWrapper, content);
    return card;
}


function createImageSection(event) {
    const wrapper = document.createElement("div");
    wrapper.className = "event-image-wrapper";

    const img = document.createElement("img");
    img.className = "event-image";
    img.src = event.image || "assets/eventImages/default.png";
    img.alt = event.title;

    const badge = createDateBadge(event);
    wrapper.append(img, badge);
    return wrapper;
}


function createDateBadge(event) {
    const dateBadge = document.createElement("div");
    dateBadge.className = "event-date";

    const date = new Date(event.datetime * 1000)
    const month = document.createElement("span");
    month.className = "month";
    month.textContent = date.toLocaleString("default", { month: "short" }).toUpperCase();

    const day = document.createElement("span");
    day.className = "day";
    day.textContent = `${date.getDate()}`;

    dateBadge.append(month, day);
    return dateBadge;
}


function createTitle(event) {
    const title = document.createElement("h3");
    title.className = "event-title";
    title.textContent = event.title;
    return title;
}


function createMeta(event) {
    const meta = document.createElement("div");
    meta.className = "event-meta";
    meta.textContent = `${event.location || "Unknown location"} • ${formatDate(event.datetime)}`;
    return meta;
}


function createAuthor(event) {
    const author = document.createElement("div");
    author.className = "event-meta author-meta";
    author.innerHTML = `Posted by <span class="author-link">@${event.createdBy}</span>`;

    const authorLink = author.querySelector(".author-link");
    authorLink.addEventListener("click", (e) => {
        e.stopPropagation();
        // Navigate to profile
    });

    return author;
}


function createDescription(event) {
    const description = document.createElement("p");
    description.className = "event-description";
    description.textContent = event.description;
    return description;
}


function createTags(event) {
    const tags = document.createElement("div");
    tags.className = "event-tags";

    (event.tags || []).forEach(tag => {
        const bubble = document.createElement("span");
        bubble.className = "tag-bubble";
        bubble.textContent = toTitleCase(tag);
        tags.appendChild(bubble);
    });

    return tags;
}


function createActions(event) {
    const actions = document.createElement("div");
    actions.className = "event-actions";

    actions.append(
        createDetailsButton(event),
        createMapButton(event)
    );

    return actions;
}


function createDetailsButton(event) {
    const detailsBtn = document.createElement("button");
    detailsBtn.className = "primary-button";
    detailsBtn.textContent = "See Details";

    detailsBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        // Extract id
        const eventId =
            event.id ||
            event._id ||
            event.eventId ||
            event.key ||
            event.uuid;

        if (!eventId) {
            console.error("No valid event ID found on event:", event);
            return;
        }

        window.location.href = `event.html?id=${eventId}`;
    });

    return detailsBtn;
}


function createMapButton(event) {
    const mapBtn = document.createElement("button");
    mapBtn.className = "tertiary-button";
    mapBtn.textContent = "Show on Map";

    // Add map button listeners
    mapBtn.addEventListener("click", () => {
        // Switch to map
        document.querySelector('[data-page="map-page"]')?.click();

        setTimeout(() => {
            if (!window.map) return;
            const latlng = [event.lat, event.lng];
            window.map.invalidateSize();
            window.map.setView(latlng, 17);
            const marker = L.marker(latlng).addTo(window.map);
            marker.bindPopup(
                `<strong>${event.title}</strong><br>
                ${event.location}<br>
                ${formatDate(event.datetime)}`
            ).openPopup();
        }, 150);
    });

    return mapBtn;
}


// Uppercase the first letter of each word
function toTitleCase(str) {
    return str.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}


// Format event datetime
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000); // assuming UNIX timestamp

    const month = date.toLocaleString("default", { month: "long" });
    const day = date.getDate();
    const time = date.toLocaleString("default", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });

    return `${month} ${day}, ${time}`;
}
