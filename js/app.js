// Get username from URL
const params = new URLSearchParams(window.location.search);
const username = params.get("user");

// Redirect to log in if username is missing
if (!username) {
    window.location.href = "index.html";
}

// Fetch buttons and pages
const navButtons = document.querySelectorAll(".nav-button");
const pages = document.querySelectorAll(".app-page");

// Add listeners to each button
navButtons.forEach(button => {
    button.addEventListener("click", () => {
        // Page belonging to current button
        const targetPage = button.dataset.page;

        // Hide all pages
        pages.forEach(page => {
            page.classList.remove("active");
        });

        // Remove active state from all buttons
        navButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        // Show selected page
        document.getElementById(targetPage).classList.add("active");

        // Mark button as active
        button.classList.add("active");
    });
});