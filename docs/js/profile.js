// Wait until page fully loads
document.addEventListener("DOMContentLoaded", () => {

    // Load saved profile data
    loadProfile();

    // Listen for image uploads
    document
        .getElementById("pfpUpload")
        .addEventListener("change", previewImage);
});



  
   /*Load Existing Profile Data*/
   
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


    // If username exists, show it
    if (savedUsername) {
        usernameInput.value = savedUsername;
    }

    // If image exists, show it
    if (savedImage) {
        avatar.src = savedImage;
    }
}



  
  /* Live Image Preview*/
   
function previewImage(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

        // Show image preview
        document.getElementById(
            "pfpPreview"
        ).src = e.target.result;
    };

    reader.readAsDataURL(file);
}



  
   /*Reserved Usernames*/
   
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



  
   /*Save Profile*/
   
function saveProfile() {

    const usernameInput =
        document.getElementById("username");

    const avatar =
        document.getElementById("pfpPreview");

    let username =
        usernameInput.value.trim();


    // Empty username check
    if (username === "") {
        alert("Username cannot be empty.");
        return;
    }

    // Reserved username check
    if (isReservedUsername(username)) {
        alert("That username is reserved.");
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

    alert("Profile updated successfully.");
}