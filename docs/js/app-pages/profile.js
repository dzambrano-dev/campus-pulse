// Wait until page fully loads
document.addEventListener("DOMContentLoaded", () => {

    // Load saved profile data
    loadProfile();

    // Listen for image uploads
    document
        .getElementById("pfpUpload")
        .addEventListener("change", previewImage);

    // Listen for username typing
    document
        .getElementById("username")
        .addEventListener("input", liveUsernameCheck);

    // Allow enter key to save
    document
        .getElementById("username")
        .addEventListener("keydown", event => {
            if (event.key === "Enter") {
                saveProfile();
            }
        });
});



/* Load Existing Profile Data */

function loadProfile() {

    // Load saved username
    const savedUsername =
        localStorage.getItem("publicUsername");

    // Load saved image
    const savedImage =
        localStorage.getItem("profilePicture");

    // Username input
    const usernameInput =
        document.getElementById("username");

    // Profile image
    const avatar =
        document.getElementById("pfpPreview");

    // Username badge
    const usernameLabel =
        document.getElementById("usernameStatus");


    // If username exists, show it
    if (savedUsername) {
        usernameInput.value = savedUsername;
    }

    // If image exists, show it
    if (savedImage) {
        avatar.src = savedImage;
    }

    // Show greeting
    if (savedUsername && usernameLabel) {
        usernameLabel.textContent =
            "Current username: @" + savedUsername;
    }
}



/* Live Image Preview */

function previewImage(event) {

    const file =
        event.target.files[0];

    if (!file) return;

    // Only allow images
    if (!file.type.startsWith("image/")) {
        alert("Please upload an image file.");
        return;
    }

    // Max file size 5MB
    if (file.size > 5 * 1024 * 1024) {
        alert("Image must be under 5MB.");
        return;
    }

    const reader =
        new FileReader();

    reader.onload = function(e) {

        // Show image preview
        document
            .getElementById("pfpPreview")
            .src = e.target.result;
    };

    reader.readAsDataURL(file);
}



/* Reserved Usernames */

function isReservedUsername(name) {

    const reserved = [
        "admin",
        "staff",
        "support",
        "official",
        "moderator",
        "csulb",
        "beachpulse"
    ];

    return reserved.includes(
        name.toLowerCase()
    );
}



/* Username Validation */

function isValidUsername(name) {

    const regex =
        /^[a-zA-Z0-9_]{3,20}$/;

    return regex.test(name);
}



/* Live Username Checker */

function liveUsernameCheck() {

    const username =
        document
            .getElementById("username")
            .value
            .trim();

    const status =
        document.getElementById(
            "usernameStatus"
        );

    if (!status) return;

    // Empty field
    if (username === "") {
        status.textContent =
            "Enter a username";
        status.style.color =
            "#777";
        return;
    }

    // Reserved username
    if (isReservedUsername(username)) {
        status.textContent =
            "Username is reserved";
        status.style.color =
            "#dc2626";
        return;
    }

    // Bad format
    if (!isValidUsername(username)) {
        status.textContent =
            "3-20 letters, numbers, underscores";
        status.style.color =
            "#dc2626";
        return;
    }

    // Looks good
    status.textContent =
        "Username available";
    status.style.color =
        "#16a34a";
}



/* Save Profile */

function saveProfile() {

    const usernameInput =
        document.getElementById(
            "username"
        );

    const avatar =
        document.getElementById(
            "pfpPreview"
        );

    let username =
        usernameInput.value.trim();

    username =
        username.replace(/\s+/g, "");


    // Empty username check
    if (username === "") {
        alert(
            "Username cannot be empty."
        );
        return;
    }

    // Reserved username check
    if (isReservedUsername(username)) {
        alert(
            "That username is reserved."
        );
        return;
    }

    // Format check
    if (!isValidUsername(username)) {
        alert(
            "Username must be 3-20 characters and only use letters, numbers, or underscores."
        );
        return;
    }

    // Save username
    localStorage.setItem(
        "publicUsername",
        username
    );

    // Save profile image
    localStorage.setItem(
        "profilePicture",
        avatar.src
    );

    // Update status text
    const status =
        document.getElementById(
            "usernameStatus"
        );

    if (status) {
        status.textContent =
            "Profile saved successfully";
        status.style.color =
            "#16a34a";
    }

    alert(
        "Profile updated successfully."
    );
}



/* Reset Profile */

function resetProfile() {

    const confirmReset =
        confirm(
            "Reset profile data?"
        );

    if (!confirmReset) return;

    localStorage.removeItem(
        "publicUsername"
    );

    localStorage.removeItem(
        "profilePicture"
    );

    location.reload();
}