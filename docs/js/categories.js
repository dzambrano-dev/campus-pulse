/**
 * categories.js
 * Event category labels, icons and formatting helpers shared across pages
 */


import { icon } from "./icons.js";


export const CATEGORIES = {
    alert: { label: "Alert" },
    academics: { label: "Academics" },
    athletics: { label: "Athletics" },
    career: { label: "Career" },
    club: { label: "Club" },
    social: { label: "Social" }
};


// Normalize an event type to a known category key
export function getCategoryKey(type) {
    const key = (type || "club").toString().trim().toLowerCase();
    return CATEGORIES[key] ? key : "club";
}


// Category chip: icon and text label, so color is never the only cue
export function categoryChipHTML(type) {
    const key = getCategoryKey(type);
    return `<span class="cat-chip" data-cat="${key}">${icon(key)}<span>${CATEGORIES[key].label}</span></span>`;
}


// "5:02 PM"
export function formatTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleTimeString("default", {
        hour: "numeric",
        minute: "2-digit"
    });
}


// "Today", "Tomorrow", "Thursday, Oct 9"
export function formatDayLabel(timestamp) {
    const date = new Date(timestamp * 1000);
    const days = dayDifference(date);

    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days === -1) return "Yesterday";

    return date.toLocaleDateString("default", {
        weekday: "long",
        month: "short",
        day: "numeric"
    });
}


// "Wednesday, October 8 · 5:02 PM"
export function formatFullDate(timestamp) {
    if (!timestamp) return "Date not available";
    const date = new Date(timestamp * 1000);
    const day = date.toLocaleDateString("default", {
        weekday: "long",
        month: "long",
        day: "numeric"
    });
    return `${day} · ${formatTime(timestamp)}`;
}


// Short relative status: "Happening now", "In 45 min", "In 3 hr", or null
export function relativeStatus(timestamp) {
    const minutes = Math.round((timestamp * 1000 - Date.now()) / 60000);

    if (minutes <= 0 && minutes > -120) return { label: "Happening now", live: true };
    if (minutes > 0 && minutes < 60) return { label: `In ${minutes} min`, live: false };
    if (minutes >= 60 && minutes < 12 * 60) return { label: `In ${Math.round(minutes / 60)} hr`, live: false };
    return null;
}


// Whole calendar days between a date and today
export function dayDifference(date) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - start) / 86400000);
}


// Escape user generated text before inserting it as HTML
export function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}
