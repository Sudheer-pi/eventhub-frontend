import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleSignup(event) {
        event.preventDefault();

        setMessage("");
        setLoading(true);

        try {
            console.log("Signup: sending request to backend");

            const response = await fetch(
    "https://eventhub-backend-g8zk.onrender.com/api/users",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
    }
);

            const responseText = await response.text();

            let data = {};

            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch {
                data = { message: responseText };
            }

            console.log("Signup HTTP status:", response.status);
            console.log("Signup response:", data);

            if (!response.ok) {
                setMessage(
                    data.message ||
                    data.error ||
                    `Signup failed (HTTP ${response.status}).`
                );
                return;
            }

            setMessage("Account created successfully! Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 1000);

        } catch (error) {
            console.error("Signup request error:", error);

            setMessage(
                "Request failed. Check the browser Console and backend terminal."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <h1>EventHub</h1>
            <h2>Create Your Account</h2>
            <p>Join your college events community.</p>

            <form onSubmit={handleSignup}>
                <div>
                    <label htmlFor="name">Full Name</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Minimum 8 characters"
                        value={form.password}
                        onChange={handleChange}
                        minLength={8}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                </button>
            </form>

            {message && <p role="status">{message}</p>}

            <p>
                Already have an account?{" "}
                <Link to="/login">Login here</Link>
            </p>
        </div>
    );
}

export default Signup;