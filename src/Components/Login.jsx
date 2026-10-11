import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            const response = await apiFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: email.trim(),
                    password
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Invalid email or password."
                );
            }

            // Read the token returned by the backend.
            const token = data.token || data.accessToken;

            // The backend may return the user directly or inside data.user.
            const user = data.user || data;

            if (!token) {
                throw new Error(
                    "Login succeeded, but the server did not return a token."
                );
            }

            // Normalize the role before checking it.
            const role = String(user.role || "")
                .trim()
                .toUpperCase();

            // Reject missing or unrecognized roles.
            if (
                role !== "ADMIN" &&
                role !== "ORGANIZER" &&
                role !== "STUDENT"
            ) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                throw new Error(
                    `Unknown user role: ${role || "missing role"}`
                );
            }

            // Save authentication details.
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify({
                ...user,
                role
            }));

            // Redirect according to the user's role.
            if (role === "ADMIN") {
                navigate("/admin/dashboard", {
                    replace: true
                });
            } else if (role === "ORGANIZER") {
                navigate("/organizer/events", {
                    replace: true
                });
            } else if (role === "STUDENT") {
                navigate("/home", {
                    replace: true
                });
            }

        } catch (err) {
            console.error("Login error:", err);

            setError(
                err.message ||
                "Unable to log in. Please try again."
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="login-page">

            <section className="login-brand-panel">

                <div className="login-brand-content">

                    <div className="login-logo">
                        <span className="login-logo-icon">E</span>
                        <span>EventHub</span>
                    </div>

                    <div className="login-brand-message">

                        <span className="login-eyebrow">
                            YOUR CAMPUS. YOUR COMMUNITY.
                        </span>

                        <h1>
                            Every great
                            <br />
                            campus moment
                            <br />
                            starts <span>here.</span>
                        </h1>

                        <p>
                            Discover college events, connect with your
                            community, and turn your ideas into experiences
                            worth remembering.
                        </p>

                        <div className="login-feature-list">

                            <div>
                                <span className="login-feature-check">
                                    ✓
                                </span>
                                Discover campus events
                            </div>

                            <div>
                                <span className="login-feature-check">
                                    ✓
                                </span>
                                Register in a few clicks
                            </div>

                            <div>
                                <span className="login-feature-check">
                                    ✓
                                </span>
                                Manage events in one place
                            </div>

                        </div>

                    </div>

                    <div className="login-brand-footer">
                        COLLEGE EVENTS, SIMPLIFIED.
                    </div>

                </div>

            </section>

            <section className="login-form-panel">

                <div className="login-form-container">

                    <div className="login-mobile-logo">
                        <span className="login-logo-icon">E</span>
                        <span>EventHub</span>
                    </div>

                    <div className="login-welcome">

                        <span className="login-form-eyebrow">
                            WELCOME BACK
                        </span>

                        <h2>Sign in to EventHub</h2>

                        <p>
                            Enter your details to access your account.
                        </p>

                    </div>

                    {error && (
                        <div className="login-error" role="alert">
                            {error}
                        </div>
                    )}

                    <form
                        className="login-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="login-field">

                            <label htmlFor="login-email">
                                Email address
                            </label>

                            <input
                                id="login-email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={event =>
                                    setEmail(event.target.value)
                                }
                                autoComplete="email"
                                required
                            />

                        </div>

                        <div className="login-field">

                            <div className="login-password-label">
                                <label htmlFor="login-password">
                                    Password
                                </label>
                            </div>

                            <div className="login-password-wrapper">

                                <input
                                    id="login-password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={event =>
                                        setPassword(event.target.value)
                                    }
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="login-show-password"
                                    onClick={() =>
                                        setShowPassword(
                                            previous => !previous
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>

                            </div>

                        </div>

                        <button
                            type="submit"
                            className="login-submit-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Signing in..."
                                : "Sign in to your account"}

                            {!loading && <span>→</span>}
                        </button>

                    </form>

                    <div className="login-divider">
                        <span>NEW TO EVENTHUB?</span>
                    </div>

                    <p className="login-signup-text">
                        Don't have an account?{" "}
                        <Link to="/signup">
                            Create an account
                        </Link>
                    </p>

                    <p className="login-security-note">
                        Your campus community, all in one place.
                    </p>

                </div>

            </section>

        </main>
    );
}

export default Login;