/**
 * utils.js
 * Shared frontend helpers
 */


// API
export const API = "https://campus-pulse-worker.vindictivity.workers.dev/api"


// Clear all visible error messages
export function clearErrors(...elements) {
    elements.forEach(el => { if (el) el.textContent = "" });
}

// Display an error message using a given element
export function showError(element, message) {
    if (!element) return;
    element.textContent = message;
}

// Redirect user to a given page
export function redirect(path) {
    window.location.assign(path);
}

// Toggles loading spinner on a button
export function setLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
        button.disabled = true;

        if (!button.dataset.originalText) {
            button.dataset.originalText = button.innerHTML;
        }

        button.innerHTML = `<span class="spinner"></span>`;
    } else {
        button.disabled = false;

        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }
}

// Safely parses JSON response
export async function safeJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

// Validate session cookie
export async function checkSession() {
    try {
        const endpoint = `${API}/user`
        const response = await fetch(endpoint, { credentials: "include" });
        if (response.status === 401) return false;  // The user has no token
        return response.ok;
    } catch {
        return false;
    }
}

// Get current page from URL
export function getPageFromUrl() {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return { page: "events", id: null };
    const [page, id] = hash.split("/");
    return { page, id: id || null };
}

// Update URL without reload
export function updateURL(page, id = null) {
    const newHash = id ? `#${page}/${id}` : `#${page}`;
    if (window.location.hash !== newHash) {
        history.pushState({}, "", newHash);
    }
}

// Reopen app page from URL
export function restorePageFromURL() {
    const { page, id } = getPageFromUrl();
    const pageId = `${page}-page`;
    const targetButton = document.querySelector(`[data-page="${pageId}"]`);

    if (page === "event" && id) {
        // Navigate to unique event page manually
        const eventPage = document.getElementById("event-page");
        if (eventPage) {
            document.querySelectorAll(".app-page").forEach(p => {
                p.classList.remove("active");
                p.style.display = "none";
            });

            eventPage.style.display = "block";
            requestAnimationFrame(() => {
                eventPage.classList.add("active");
            });

            // Load correct event
            import("./app-pages/eventPage.js").then(({ loadEventPage }) => {
                loadEventPage(id);
            });
        }
        return;
    }

    if (targetButton) {
        targetButton.click();
    } else {
        updateURL("events");
    }
}

// Attach map button to map
export function attachMapButton(event, mapBtn) {
    mapBtn.addEventListener("click", () => {
        document.querySelector('[data-page="map-page"]')?.click();

        setTimeout(() => {
            if (!window.map) return;

            let opened = false;

            const tryOpen = () => {
                if (opened) return;

                const marker = window.mapMarkers?.find(m => m._eventId === event.id);

                if (!marker) {
                    // Try next frame
                    requestAnimationFrame(tryOpen);
                    return;
                }

                opened = true;

                // Center map and open popup
                const latlng = marker.getLatLng();
                window.map.invalidateSize();
                window.map.flyTo(latlng, 17, { duration: 0.4 });
                window.map.once("moveend", () => {
                    marker.openPopup();
                });
            }

            tryOpen();
        }, 100);
    });
}

// Convert image to webP
export async function convertToWebP(file) {
    const img = new Image();
    const reader = new FileReader();

    return new Promise((resolve) => {
        reader.onload = () => {
            img.src = reader.result;
        };

        img.onload = () => {
            const maxSize = 512;
            let width = img.width;
            let height = img.height;

            // Maintain aspect ratio
            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/webp", 0.8));
        }

        reader.readAsDataURL(file);
    });
}