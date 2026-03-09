// Get username from URL
const params = new URLSearchParams(window.location.search);
const username = params.get("user");

async function loadInterests() {
    try {
        // Fetch list of possible interests
        const interestsResponse = await fetch("interests.json");
        const interestsData = await interestsResponse.json();

        // Fetch user data
        const usersResponse = await fetch("users.json");
        const usersData = await usersResponse.json();

        // Find current user data
        const user = usersData.users.find(u => u.username === username);
        const userInterests = user && user.interests ? user.interests : [];

        // Generate interest checkboxes
        const container = document.getElementById("interests-list");
        container.innerHTML = "";
        interestsData.interests.forEach(interest => {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = interest;

            // If user already selected this interest, toggle it on
            if (userInterests.includes(interest)) {
                checkbox.checked = true;
            }

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(" " + interest));
            container.appendChild(label);
            container.appendChild(document.createElement("br"));
        });

    } catch(err) {
        console.log("Failed to load interests:", err);
    }
}

loadInterests();

// Form submission
document.getElementById("interests-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    // Collect selected interests
    const selectedInterests = [];
    document.querySelectorAll("#interests-list input:checked").forEach(box => {
        selectedInterests.push(box.value);
    });

    try {
        // Send interests to worker
        await fetch("/api/update-interests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username,
                interests: selectedInterests
            })
        });

        // Switch to feed
        window.location.href = `app.html?user=${username}`;

    } catch(err) {
        console.error("Failed to update interests:", err);
    }
});