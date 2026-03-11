let token;

// Wait until DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    token = localStorage.getItem("sessionToken");

    // Redirect if not logged in
    if (!token) {
        window.location.assign("/index.html");
        return;
    }

    // Generate interest buttons
    loadInterests();

    // Add submit button listener
    document.getElementById("interests-form").addEventListener("submit", submit);
});

const API = "https://campus-pulse-worker.vindictivity.workers.dev/api"

// Generate interest buttons
async function loadInterests() {
    const error = document.getElementById("interests-error");
    error.textContent = "";

    try {
        // Fetch list of possible interests
        const interestsResponse = await fetch("data/interests.json");
        const interestsData = await interestsResponse.json();

        // Fetch user interests
        const endpoint = `${API}/user`
        const userResponse = await fetch(endpoint, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!userResponse.ok) {
            window.location.assign("index.html");
            return;
        }

        // Find current user data
        const userData = await userResponse.json();
        const userInterests = userData.interests || [];

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
        console.log(err);
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
        // Send interests to worker
        const endpoint = `${API}/update-interests`
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                interests: selectedInterests
            })
        });

        const result = await response.json();

        // Server error
        if (!response.ok) {
            error.textContent = result.error || "Failed to update interests";
            return;
        }

        // Switch to feed
        window.location.assign("/app.html");
    } catch(err) {
        error.textContent = "Failed to save interests";
        console.error(err);
    }
}