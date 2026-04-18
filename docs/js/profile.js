// Runs when page fully loads
document.addEventListener("DOMContentLoaded", () => {

    // Pull stored Microsoft email
    let email = localStorage.getItem("userEmail");

    // If not signed in, redirect home
    if (!email) {
        window.location.href = "index.html";
        return;
    }

    // Load saved username if it exists
    let savedUsername = localStorage.getItem("publicUsername");

    if (savedUsername) {
        document.getElementById("username").value = savedUsername;
    } else {
        // Auto-generate username from email
        document.getElementById("username").value =
            generateDefaultUsername(email);
    }

    // Profile picture preview handling
    document
        .getElementById("pfpUpload")
        .addEventListener("change", previewProfilePicture);
});


// Generates username from email
// john.smith27@student.csulb.edu
// becomes @j.smith27
function generateDefaultUsername(email) {

    let firstPart = email.split("@")[0];
    let parts = firstPart.split(".");

    if (parts.length >= 2) {
        return "@" + parts[0][0] + "." + parts[1];
    }

    return "@" + firstPart;
}


// Reserved usernames users cannot use
function isReservedUsername(name) {

    const reserved = [
        "@admin",
        "@administrator",
        "@staff",
        "@support",
        "@official",
        "@csulb",
        "@moderator",
        "@campuspulse"
    ];

    return reserved.includes(name.toLowerCase());
}


// Save profile info
function saveProfile() {

    let username =
        document.getElementById("username")
        .value
        .trim();

    // Require username
    if (username === "") {
        alert("Username cannot be empty.");
        return;
    }

    // Force @ symbol
    if (!username.startsWith("@")) {
        username = "@" + username;
    }

    // Check reserved names
    if (isReservedUsername(username)) {
        alert("That username is reserved.");
        return;
    }

    // Save username
    localStorage.setItem(
        "publicUsername",
        username
    );

    alert("Profile updated successfully.");
}


// Preview uploaded profile picture
function previewProfilePicture(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

        // Show preview image
        document.getElementById("pfpPreview").src =
            e.target.result;

        // Save image locally
        localStorage.setItem(
            "profilePicture",
            e.target.result
        );
    };

    reader.readAsDataURL(file);
}