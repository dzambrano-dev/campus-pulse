// map.js

async function initMap() {

    map = L.map("map").setView([33.7838, -118.1141], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);


    // Load events
    const response = await fetch("data/events.json");
    const events = await response.json();

    events.forEach(event => {

        // temporary random coordinates near campus
        const lat = 33.7838 + (Math.random() - 0.5) * 0.002;
        const lng = -118.1141 + (Math.random() - 0.5) * 0.002;

        const marker = L.marker([lat, lng]).addTo(map);

        marker.bindPopup(`
            <strong>${event.title}</strong><br>
            ${event.location}<br>
            ${event.date} ${event.time}
        `);
    });
}
//Added time-out
setTimeout(() => {
    map.invalidateSize();
}, 200);

initMap();