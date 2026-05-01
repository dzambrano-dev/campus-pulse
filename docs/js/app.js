/**
 * app.js
 * Handles application frontend and KV database fetching
 */


import { API, checkSession, safeJson, redirect, updateURL, restorePageFromURL, getPageFromUrl } from "./utils.js";
import { initEventCreation, refreshEventCreationPage, setEventCreationMapTheme } from "./app-pages/eventCreation.js";
import { initMap, setMapTheme, activateMap } from "./app-pages/map.js";
import { loadEvents } from "./app-pages/eventFeed.js";
import { openEvent } from "./app-pages/eventPage.js";
import { openProfile } from "./app-pages/profile.js";

// Data members
let currentUserId;
let currentUsername;
let currentRole;

// Icons
const moonSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M20.71 13.51c-.78.23-1.58.35-2.38.35-4.52 0-8.2-3.68-8.2-8.2 0-.8.12-1.6.35-2.38a1.002 1.002 0 0 0-1.25-1.25A10.17 10.17 0 0 0 2 11.8C2 17.42 6.58 22 12.2 22c4.53 0 8.45-2.91 9.76-7.24a1.002 1.002 0 0 0-1.25-1.25"></path><path d="m16 8 .94-2.06L19 5l-2.06-.94L16 2l-.94 2.06L13 5l2.06.94zm4.25-.5-.55 1.2-1.2.55 1.2.55.55 1.2.55-1.2 1.2-.55-1.2-.55z"></path></svg>`;
const sunSVG = `<svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg" xmlns="http://www.w3.org/2000/svg"><path d="M12 6.99a5.01 5.01 0 1 0 0 10.02 5.01 5.01 0 1 0 0-10.02M13 19h-2v3h2zm0-17h-2v3h2zM2 11h3v2H2zm17 0h3v2h-3zM4.22 18.36l.71.71.71.71 1.06-1.06 1.06-1.06-.71-.71-.71-.71-1.06 1.06zM19.78 5.64l-.71-.71-.71-.71-1.06 1.06-1.06 1.06.71.71.71.71 1.06-1.06zm-12.02.7L6.7 5.28 5.64 4.22l-.71.71-.71.71L5.28 6.7l1.06 1.06.71-.71zm8.48 11.32 1.06 1.06 1.06 1.06.71-.71.71-.71-1.06-1.06-1.06-1.06-.71.71z"></path></svg>`;

document.addEventListener("DOMContentLoaded", initApp);


// Main application startup
async function initApp() {
    const isLoggedIn = await checkSession();

    if (!isLoggedIn) {
        redirect("index.html");
        return;
    }

    // Validate session and load user
    const user = await loadUser();
    if (!user) {
        redirect("index.html")
        return;
    }

    currentUserId = user.id;
    currentUsername = user.username;
    currentRole = user.role;

    // Initialize application
    initSettingsMenu();
    initEventCreation({
        currentRole,
        loadEvents
    });
    initNavigation();
    initMap();

    window.addEventListener("popstate", () => {
        restorePageFromURL();
    });

    if (!window.location.hash) {
        updateURL("events");
    }

    showInitialPage();
    await loadEvents();
}


// Authenticate user
async function loadUser() {
    try {
        const endpoint = `${API}/user`
        const response = await fetch(endpoint, {
            credentials: "include"
        });

        if (!response.ok) return null;
        return await safeJson(response);
    } catch {
        return null;
    }
}


// Initialize navigation bar
function initNavigation() {
    const navButtons = document.querySelectorAll(".nav-button");

    // Set up buttons
    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetPage = button.dataset.page;
            if (!targetPage) return;

            const pageKey = targetPage.replace("-page", "");

            const currentPage = document.querySelector(".app-page.active");
            const nextPage = document.getElementById(targetPage);
            if (!nextPage || currentPage === nextPage) return;

            // Update URL
            const currentPageKey = getPageFromUrl();
            if (currentPageKey !== pageKey) {
                updateURL(pageKey);
            }

            // Update nav buttons
            navButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            // Prepare next page
            nextPage.style.display = "block";

            // Fade out current page
            if (currentPage) {
                currentPage.classList.remove("active");
                currentPage.classList.add("fade-out");
            }

            // Fade in next page
            requestAnimationFrame(() => {
                nextPage.classList.add("active");

                // Reset scroll
                nextPage.scrollTop = 0;
                window.scrollTo(0, 0);
            });

            // Animation clean up
            setTimeout(() => {
                if (currentPage) {
                    currentPage.style.display = "none";
                    currentPage.classList.remove("fade-out");
                    currentPage.classList.remove("active");
                }

                // Redraw map if map page is open
                if (targetPage === "map-page") {
                    activateMap();
                }
            }, 250);
        });
    });
}


// Initialize settings menu
function initSettingsMenu () {
    const icon = document.getElementById("theme-icon");
    if (icon) {
        const isDark = document.body.classList.contains("dark-mode");
        icon.innerHTML = isDark ? sunSVG : moonSVG;
    }

    const menu = document.getElementById("settings-menu");
    const button = document.getElementById("settings-button");
    if (!button || !menu) return;

    // Attach button listeners
    document.getElementById("go-to-profile").addEventListener("click", goToProfile);
    document.getElementById("toggle-theme").addEventListener("click", toggleDarkMode);
    document.getElementById("toggle-ui").addEventListener("click", toggleCompactUI);
    document.getElementById("logout-button").addEventListener("click", logout);

    // Click outside to close
    document.addEventListener("click", (event) => {
        if (button.contains(event.target)) {
            menu.classList.toggle("open");
        } else if (!menu.contains(event.target)) {
            menu.classList.remove("open");
        }
    });
}


// Send to user profile
function goToProfile(){
    openProfile(currentUsername, currentUserId);
}


// Toggle dark mode
function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    const icon = document.getElementById("theme-icon");
    if (icon) icon.innerHTML = isDark ? sunSVG : moonSVG;
    setMapTheme(isDark);
    setEventCreationMapTheme(isDark);
}

// Toggle compact UI for events feed
function toggleCompactUI() {
    document.body.classList.toggle("compact-ui");
}


// Log out
async function logout() {
    try {
        const endpoint = `${API}/logout`;
        await fetch(endpoint, {
            method: "POST",
            credentials: "include"
        });
    } catch {}

    redirect("index.html");
}


async function showInitialPage() {
    const { page, id } = getPageFromUrl();
    const pageId = `${page}-page`;

    const pages = document.querySelectorAll(".app-page");
    const navButtons = document.querySelectorAll(".nav-button");

    // Hide everything
    pages.forEach(p => {
        p.classList.remove("active", "fade-out");
        p.style.display = "none";
    });

    const targetPage = document.getElementById(pageId);
    if (!targetPage) return;

    // Show target page
    targetPage.style.display = "block";
    targetPage.getBoundingClientRect();
    targetPage.classList.add("active");

    // Handle event page
    if (page === "event" && id) {
        openEvent(id);
        return;
    }

    // Handle profile page
    if (page === "profile" && id) {
        await openProfile(id);
        return;
    }

    // Decide nav button
    navButtons.forEach(btn => {
        if (page === "event" || page === "profile") {
            btn.classList.remove("active");
        } else {
            btn.classList.toggle("active", btn.dataset.page === pageId);
        }
    });

    // Activate the map
    if (pageId === "map-page") {
        setTimeout(() => activateMap(), 50);
    }

    // Activate the event creation
    if (pageId === "event-creation-page") {
        refreshEventCreationPage()
    }
}