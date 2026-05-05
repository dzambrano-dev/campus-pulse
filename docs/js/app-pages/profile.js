/**
 * profile.js
 * Handles profile functionality
 */


import { API, ASSETS, redirect, safeJson, setLoading, showError, updateURL } from "../utils.js";


let isEditing = false;
let selectedAvatarFile = null;


// External method
export function openProfile(username, userId) {
    if (!username || !userId) return;
    updateURL("profile", username);
    loadProfile(userId);
    animateProfile();
}


// Load profile data
async function loadProfile(userId) {
    const profileContainer = document.getElementById("profile-page-container");
    const profileError = document.getElementById("profile-page-error")
    if (!profileContainer || !userId) return;
    profileContainer.innerHTML = "";
    profileError.textContent = "";

    try {
        const endpoint = `${API}/get-user?id=${userId}`;
        const response = await fetch(endpoint, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            showError(profileError, "Failed to load profile");
            return;
        }

        // Fetch current user
        const sessionRes = await fetch(`${API}/user`, {
            credentials: "include"
        });

        const profileUser = await safeJson(response);
        const sessionUser = await safeJson(sessionRes);
        renderProfile(profileUser, sessionUser);
    } catch (error) {
        console.error(error);
        showError(profileError, "Failed to load profile");
    }
}


// Render profile elements
function renderProfile(user, sessionUser) {
    const isOwner = sessionUser?.id === user.id;
    const isAdmin = sessionUser?.role === "admin";
    const profileIsAdmin = user.role === "admin";

    const container = document.getElementById("profile-page-container");
    if (!container) return;

    const avatar = user.avatar
        ? `${ASSETS}${user.avatar}`
        : "assets/images/default-avatar.png";

    const username = user.username || "unknown";
    const interests = user.interests || [];
    const role = user.role || "user";

    container.innerHTML = `
        <div class="profile-card">
            <!-- Avatar -->
            <div class="avatar-section">
                <img src="${avatar}" class="profile-avatar" alt="Avatar">
                ${isOwner && isEditing ? `
                    <input type="file" id="avatar-input" accept = "image/*" hidden>
                ` : ""}
            </div>
            
            <!-- Header -->
            <div class="profile-header">
                ${isOwner && isEditing
                    ? `<input id="edit-username" class="profile-input" value="${username}">`
                    : `<h1 class="profile-title">@${username}</h1>`
                }
                <p class="profile-role profile-role-${role}">${role}</p>
                <div class="profile-interests">
                    ${isOwner && isEditing
                        ? `<button id="edit-interests-button" class="secondary-button">Update Interests</button>`
                        : interests.length > 0
                            ? interests.map(tag => `<span class="profile-interest-bubble">${tag}</span>`).join("")
                            : `<span class="profile-note">No interests yet</span>`
                    }
                </div>
            </div>
        </div>
        
        ${renderProfileActions(isOwner, isAdmin, profileIsAdmin, user)}
    `

    attachProfileActions(user, sessionUser);
}


// Animate profile objects
function animateProfile() {
    const currentPage = document.querySelector(".app-page.active");
    const profilePage = document.getElementById("profile-page");

    if (!profilePage || currentPage === profilePage) return;

    profilePage.style.display = "block";

    if (currentPage) {
        currentPage.classList.remove("active");
        currentPage.classList.add("fade-out");
    }

    requestAnimationFrame(() => {
        profilePage.classList.add("active");
    });

    setTimeout(() => {
        if (currentPage) {
            currentPage.style.display = "none";
            currentPage.classList.remove("fade-out");
        }
    }, 250);
}


function renderProfileActions(isOwner, isAdmin, profileIsAdmin, user) {
    const buttons = [];

    // Show the edit profile button to the profile owner
    if (isOwner) {
        buttons.push(`
            <button id="edit-profile-button">
                ${isEditing ? "Save Changes" : "Edit Profile"}
            </button>
        `);
    }

    // Show the toggle organizer button to admins on non-admin profiles
    if (isAdmin && !profileIsAdmin) {
        const isOrganizer = user.role === "organizer";

        buttons.push(`
            <button class="toggle-role-button ${isOrganizer ? "demote" : "promote"}" id="toggle-role-button">
                ${isOrganizer ? "Remove Organizer" : "Make Organizer"}
            </button>
        `);
    }

    // Nothing to show
    if (buttons.length === 0) return "";

    return `
        <div class="profile-actions-container">
            ${buttons.join("")}
        </div>
    `;
}


// Attach button actions
async function attachProfileActions(user, sessionUser) {
    const isOwner = sessionUser?.id === user.id;
    const isAdmin = sessionUser?.role === "admin";
    const profileIsAdmin = user.role === "admin";

    // Edit Profile
    if (isOwner) {
        const editBtn = document.getElementById("edit-profile-button");
        if (editBtn) {
            editBtn.addEventListener("click", async () => {
                if (!isEditing) {
                    isEditing = true;
                    renderProfile(user, sessionUser);
                    return;
                }

                // Save Profile
                await saveProfile(user);
            });
        }

        const interestsBtn = document.getElementById("edit-interests-button");

        if (interestsBtn) {
            interestsBtn.addEventListener("click", () => {
                redirect("interests.html");
            })
        }
    }

    // Toggle Organizer
    if (isAdmin && !profileIsAdmin) {
        const toggleBtn = document.getElementById("toggle-role-button");
        if (toggleBtn) {
            toggleBtn.addEventListener("click", async () => {
                setLoading(toggleBtn, true);

                try {
                    const res = await fetch(`${API}/toggle-organizer`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: user.id })
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        console.log(data.error || "Failed to update role");
                        setLoading(toggleBtn, false);
                        return;
                    }

                    console.log(`User ${data.id} is now ${data.role}`);

                    // Reload profile
                    await loadProfile(user.id);
                } catch {
                    console.error("Network error:", err);
                    setLoading(toggleBtn, false);
                }
            });
        }
    }
}


async function saveProfile(user) {
    alert("Function not implemented");
}