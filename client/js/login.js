const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Logging in...";

    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

        const data = await response.json();

        console.log("Login response:", data);

        if (!response.ok) {
            message.textContent = data.message || "Login failed.";
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );

        message.textContent = "Login successful!";

        setTimeout(() => {
            window.location.href =
                "http://localhost:5000/dashboard.html";
        }, 500);

    } catch (error) {
        console.error("Login error:", error);

        message.textContent =
            "Unable to connect to server.";
    }
});