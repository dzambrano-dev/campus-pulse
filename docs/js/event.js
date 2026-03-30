// event.js
// Handles loading a single event



//Get event ID from URL
const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");


// DOM references 
const container = document.getElementById("event-container");


// Main loader
async function loadEvent() {
    try {
        // Fetch event data
        const response = await fetch("data/events.json");
        const events = await response.json();

        // Find matching event
        const event = events.find(e => e.id == eventId);

        //Handle missing event
        if (!event) {
            container.innerHTML = `
                <div class="not-found">
                    <h2>Event not found</h2>
                </div>
            `;
            return;
        }

        //Format date + time
        const dateObj = new Date(event.datetime);

        const formattedDate = dateObj.toLocaleDateString();
        const formattedTime = dateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

        // Render event HTML
        container.innerHTML = `
            <div class="event-card">

                <!-- Event Image -->
                <img class="event-image" src="${event.image}" alt="${event.title}">

                <div class="event-content">

                    <!-- Title -->
                    <div class="event-title">${event.title}</div>

                    <!-- Meta Info -->
                    <div class="event-meta">
                        <span><strong>Club:</strong> ${event.club}</span>
                        <span><strong>Category:</strong> ${event.category}</span>
                        <span><strong>Date:</strong> ${formattedDate}</span>
                        <span><strong>Time:</strong> ${formattedTime}</span>
                        <span><strong>Location:</strong> ${event.location}</span>
                    </div>

                    <!-- Description -->
                    <div class="event-description">
                        ${event.description}
                    </div>

                </div>

            </div>
        `;

    } catch (error) {
        console.error("Error loading event:", error);

        container.innerHTML = `
            <div class="not-found">
                <h2>Error loading event</h2>
            </div>
        `;
    }
}


//Back button logic
function goBack() {
    window.location.href = "app.html";
}


//Initialize page
loadEvent();