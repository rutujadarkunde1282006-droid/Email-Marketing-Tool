const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Creating account...";

    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/register",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            }
        );

        const data = await response.json();

        console.log("Registration response:", data);

        if (!response.ok) {
            message.textContent = data.message || "Registration failed.";
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );

        message.textContent = "Registration successful!";

        setTimeout(() => {
            window.location.href =
                "http://localhost:5000/dashboard.html";
        }, 500);

    } catch (error) {
        console.error("Registration error:", error);

        message.textContent =
            "Unable to connect to server.";
    }
});