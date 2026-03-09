// Get all nav buttons
const navButtons = document.querySelectorAll(".nav-button");

// Get all app pages
const pages = document.querySelectorAll(".app-page");

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