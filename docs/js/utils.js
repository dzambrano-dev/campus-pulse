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
    return hash || "events";
}

// Update URL without reload
export function updateURL(page) {
    const newHash = `#${page}`;
    if (window.location.hash !== newHash) {
        history.pushState({}, "", newHash);
    }
}

// Reopen app page from URL
export function restorePageFromURL() {
    const page = getPageFromUrl();
    const pageId = `${page}-page`;
    const targetButton = document.querySelector(`[data-page="${pageId}"]`);

    if (targetButton) {
        targetButton.click();
    } else {
        updateURL("events");
    }
}