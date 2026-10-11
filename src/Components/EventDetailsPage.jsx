import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";

function EventDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [registering, setRegistering] = useState(false);

    // Load event details and allow only approved events
    useEffect(() => {
        let cancelled = false;

        async function loadEvent() {
            setLoading(true);
            setError("");
            setEvent(null);

            try {
                const response = await apiFetch(
                    `/api/events/${id}`
                );

                if (!response.ok) {
                    throw new Error("Could not find this event.");
                }

                const data = await response.json();

                if (cancelled) {
                    return;
                }

                // Block pending and rejected events
                if (
                    String(data.status || "").toUpperCase() !==
                    "APPROVED"
                ) {
                    setError(
                        "This event is not approved and cannot be viewed by students."
                    );
                    return;
                }

                setEvent(data);
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Error fetching event:",
                        error
                    );

                    setError(
                        error.message || "Could not load event."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadEvent();

        return () => {
            cancelled = true;
        };
    }, [id]);

    // Register for the event
    async function handleRegister() {
        setMessage("");

        const token = localStorage.getItem("token");

        const user = JSON.parse(
            localStorage.getItem("user") || "null"
        );

        if (!token || !user) {
            navigate("/login", { replace: true });
            return;
        }

        if (user.role !== "STUDENT") {
            setMessage(
                "Only students can register for events."
            );
            return;
        }

        // Double-check the event status before registering
        if (
            !event ||
            String(event.status || "").toUpperCase() !==
            "APPROVED"
        ) {
            setMessage(
                "You can register only for approved events."
            );
            return;
        }

        setRegistering(true);

        try {
            const response = await apiFetch(
                `/api/registrations/${user.id}/${id}`,
                {
                    method: "POST"
                }
            );

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                setMessage("Registration successful!");
            } else if (response.status === 409) {
                setMessage(
                    data.message ||
                    "You are already registered for this event."
                );
            } else {
                setMessage(
                    data.message ||
                    `Registration failed (HTTP ${response.status}).`
                );
            }
        } catch (error) {
            console.error("Registration error:", error);

            setMessage(
                "Could not connect to the server."
            );
        } finally {
            setRegistering(false);
        }
    }

    // Loading screen
    if (loading) {
        return (
            <div className="home-container">
                <p>Loading event details...</p>
            </div>
        );
    }

    // Error or unapproved event
    if (error || !event) {
        return (
            <div className="home-container">
                <h2>Event Unavailable</h2>

                <p>
                    {error || "Event not found."}
                </p>

                <button onClick={() => navigate("/")}>
                    Back to Events
                </button>
            </div>
        );
    }

    // Approved event details
    return (
        <div className="home-container">
            <div className="event-card event-details-card">
                <h1>{event.title}</h1>

                <p>
                    <strong>Description:</strong>{" "}
                    {event.description ||
                        "No description available."}
                </p>

                <p>
                    <strong>Date:</strong>{" "}
                    {event.date || "Not specified"}
                </p>

                <p>
                    <strong>Time:</strong>{" "}
                    {event.time || "Not specified"}
                </p>

                <p>
                    <strong>Venue:</strong>{" "}
                    {event.venue || "Not specified"}
                </p>

                <p>
                    <strong>Category:</strong>{" "}
                    {event.category?.name || "N/A"}
                </p>

                <p>
                    <strong>Capacity:</strong>{" "}
                    {event.capacity ?? "Not specified"}
                </p>

                <p>
                    <strong>Status:</strong>{" "}
                    {event.status}
                </p>

                <button
                    onClick={handleRegister}
                    disabled={registering}
                >
                    {registering
                        ? "Registering..."
                        : "Register"}
                </button>

                {message && (
                    <p role="status">
                        {message}
                    </p>
                )}

                <button onClick={() => navigate("/")}>
                    Back to Events
                </button>
            </div>
        </div>
    );
}

export default EventDetailsPage;