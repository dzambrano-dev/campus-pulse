/**
 * app.js
 * Handles application frontend and KV database fetching
 */


import { API, ASSETS, checkSession, safeJson, redirect, updateURL, restorePageFromURL, getPageFromUrl, isDarkTheme, setTheme, isClearView, setClearView } from "./utils.js";
import { initEventCreation, refreshEventCreationPage, setEventCreationMapTheme } from "./app-pages/eventCreation.js";
import { initMap, setMapTheme, activateMap } from "./app-pages/map.js";
import { loadEvents, renderFeed } from "./app-pages/eventFeed.js";
import { openEvent } from "./app-pages/eventPage.js";
import { openProfile } from "./app-pages/profile.js";
import { openPolicies } from "./policies.js";

// Data members
let currentUserId;
let currentUsername;
let currentRole;
let appReady = false;
let hasNavigated = false;


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
    initSettingsMenu(user);
    initRouteChrome();
    initEventCreation({
        currentRole,
        loadEvents
    });
    initNavigation();
    initMap();

    window.addEventListener("popstate", () => {
        restorePageFromURL();
        syncRouteChrome();
    });

    const { page } = getPageFromUrl();

    if (!page) {
        updateURL("events");
    }

    await showInitialPage();
    syncRouteChrome();
    appReady = true;
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
function initSettingsMenu(user) {
    const menu = document.getElementById("settings-menu");
    const button = document.getElementById("settings-button");
    if (!button || !menu) return;

    // User identity
    renderAvatar(document.getElementById("settings-avatar"), user);
    renderAvatar(document.getElementById("menu-avatar"), user);
    const name = document.getElementById("menu-username");
    if (name) name.textContent = `@${user.username || "you"}`;

    // Attach button listeners
    document.getElementById("go-to-profile").addEventListener("click", () => {
        closeMenu();
        goToProfile();
    });
    document.getElementById("policies-button").addEventListener("click", () => {
        closeMenu();
        openPolicies();
    });
    document.getElementById("logout-button").addEventListener("click", logout);

    // Theme
    const themeButtons = menu.querySelectorAll("[data-theme-option]");
    const syncTheme = () => themeButtons.forEach(btn => {
        btn.setAttribute("aria-checked", String(btn.dataset.themeOption === (isDarkTheme() ? "dark" : "light")));
    });
    themeButtons.forEach(btn => btn.addEventListener("click", () => {
        setTheme(btn.dataset.themeOption);
        syncTheme();
        const isDark = isDarkTheme();
        setMapTheme(isDark);
        setEventCreationMapTheme(isDark);
    }));
    syncTheme();

    // Clear View
    const clearSwitch = document.getElementById("toggle-ui");
    clearSwitch.setAttribute("aria-checked", String(isClearView()));
    document.getElementById("clear-view-row").addEventListener("click", () => {
        setClearView(!isClearView());
        clearSwitch.setAttribute("aria-checked", String(isClearView()));
        renderFeed();
    });

    // Open, close, click outside and escape
    function closeMenu() {
        menu.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
    }

    button.addEventListener("click", (event) => {
        event.stopPropagation();
        const open = menu.classList.toggle("open");
        button.setAttribute("aria-expanded", String(open));
    });

    // An outside tap only closes the panel, it doesn't activate what's underneath
    document.addEventListener("click", (event) => {
        if (!menu.classList.contains("open")) return;
        if (menu.contains(event.target) || button.contains(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
    }, true);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menu.classList.contains("open")) {
            closeMenu();
            button.focus();
        }
    });
}


// Show the user's avatar image, or their initial as a fallback
function renderAvatar(element, user) {
    if (!element) return;
    element.textContent = (user.username || "?").charAt(0);

    if (!user.avatar) return;
    const url = `${ASSETS}${user.avatar}`;
    const probe = new Image();
    probe.onload = () => {
        element.textContent = "";
        element.style.backgroundImage = `url("${url}")`;
    };
    probe.src = url;
}


// Back button and brand link
function initRouteChrome() {
    const backButton = document.getElementById("back-button");
    const brandLink = document.getElementById("brand-link");

    backButton?.addEventListener("click", () => {
        // Go back within the app when possible, otherwise to the feed
        if (hasNavigated) {
            history.back();
        } else {
            document.querySelector('[data-page="events-page"]')?.click();
        }
    });

    brandLink?.addEventListener("click", (event) => {
        event.preventDefault();
        document.querySelector('[data-page="events-page"]')?.click();
    });

    window.addEventListener("routechange", () => {
        if (appReady) hasNavigated = true;
        syncRouteChrome();
    });
}


// Reflect the current route in the top bar and navigation
function syncRouteChrome() {
    const { page } = getPageFromUrl();
    const isDetail = page === "event" || page === "profile";

    const backButton = document.getElementById("back-button");
    if (backButton) backButton.hidden = !isDetail;

    document.querySelectorAll(".nav-button").forEach(btn => {
        btn.classList.toggle("active", !isDetail && btn.dataset.page === `${page}-page`);
        if (btn.classList.contains("active")) {
            btn.setAttribute("aria-current", "page");
        } else {
            btn.removeAttribute("aria-current");
        }
    });
}


// Send to user profile
function goToProfile(){
    openProfile(currentUsername, currentUserId);
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
        const userId = await fetchUserId(id);
        openProfile(id, userId);
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


export async function fetchUserId(username) {
    const res = await fetch(`${API}/get-user-id?username=${encodeURIComponent(username)}`, {
        credentials: "include"
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.userId;
}