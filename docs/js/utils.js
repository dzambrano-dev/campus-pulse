/**
 * utils.js
 * Shared frontend helpers
 */


// API
const API = "https://campus-pulse-worker.vindictivity.workers.dev/api"


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
        return response.ok;
    } catch {
        return false;
    }
}