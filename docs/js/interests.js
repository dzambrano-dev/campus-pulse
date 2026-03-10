// Wait until DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Generate interest buttons
    loadInterests();

    // Add submit button listener
    document.getElementById("interests-form").addEventListener("submit", submit);
});

// Get username from URL
const params = new URLSearchParams(window.location.search);
const username = params.get("user");

// Redirect to log in if username is missing
if (!username) {
    window.location.href = "index.html";
}

// Generate interest buttons
async function loadInterests() {
    const error = document.getElementById("interests-error");
    error.textContent = "";

    try {
        // Fetch list of possible interests
        const interestsResponse = await fetch("data/interests.json");
        const interestsData = await interestsResponse.json();

        // Fetch user data
        const usersResponse = await fetch("data/users.json");
        const usersData = await usersResponse.json();

        // Find current user data
        const user = usersData.users.find(u => u.username === username);

        if (!user) {
            window.location.href = "index.html";
            return;
        }

        const userInterests = user.interests || [];

        // Generate interest checkboxes
        const container = document.getElementById("interests-list");
        container.innerHTML = "";
        interestsData.interests.forEach(interest => {
            // Create a button
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = interest;
            button.classList.add("interest-button");

            // Select previously saved interests
            if (userInterests.includes(interest)) {
                button.classList.add("selected");
            }

            // Add a listener to toggle each button
            button.addEventListener("click", () => {
                button.classList.toggle("selected");
            });

            // Append each button to the container
            container.appendChild(button);
        });

    } catch(err) {
        error.textContent = "Failed to load interests";
        console.log("Failed to load interests:", err);
    }
}

// Form submission
async function submit(event) {
    event.preventDefault();

    const error = document.getElementById("interests-error");
    error.textContent = "";

    // Collect pre-selected interests
    const selectedInterests = [];
    document.querySelectorAll("#interests-list .interest-button.selected").forEach(box => {
        selectedInterests.push(box.textContent);
    });

    // Require at least 3 interests
    if (selectedInterests.length < 3) {
        error.textContent = "Select at least 3 interests";
        return;
    }

    try {
        // This section will be implemented after repository is converted to GitHub Pages

        //// Send interests to worker
        // const response = await fetch("/api/update-interests", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({
        //         username: username,
        //         interests: selectedInterests
        //     })
        // });
        //
        // // Server error
        // if (!response.ok) { throw new Error("Update rejected"); }

        // Switch to feed
        window.location.href = `../app.html?user=${username}`;

    } catch(err) {
        error.textContent = "Failed to save interests";
        console.error("Failed to update interests:", err);
    }
}