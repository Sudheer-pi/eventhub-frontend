import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

function MyEvents() {
    const navigate = useNavigate();

    const [registrations, setRegistrations] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(
            localStorage.getItem("user") || "null"
        );

        if (!token || !user) {
            navigate("/login", { replace: true });
            return;
        }

        if (user.role !== "STUDENT") {
            setMessage("Only students can view their registrations.");
            setLoading(false);
            return;
        }

        loadMyEvents(user.id);
    }, [navigate]);

    async function loadMyEvents(userId) {
        setLoading(true);
        setMessage("");

        try {
            const response = await apiFetch(
                `/api/registrations/student/${userId}`
            );

            if (!response.ok) {
                throw new Error(
                    `Could not load registrations (HTTP ${response.status}).`
                );
            }

            const data = await response.json();

            setRegistrations(
                Array.isArray(data) ? data : []
            );

            if (!Array.isArray(data) || data.length === 0) {
                setMessage(
                    "You have not registered for any events yet."
                );
            }
        } catch (error) {
            console.error("My Events error:", error);
            setMessage(error.message || "Could not load your registrations.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel(registrationId) {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this registration?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await apiFetch(
                `/api/registrations/${registrationId}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Could not cancel registration (HTTP ${response.status}).`
                );
            }

            const user = JSON.parse(
                localStorage.getItem("user") || "null"
            );

            if (user) {
                await loadMyEvents(user.id);
            }
        } catch (error) {
            console.error("Cancel registration error:", error);
            alert(error.message || "Could not cancel registration.");
        }
    }

    return (
        <section className="my-events">
            <h2>My Registered Events</h2>

            {loading ? (
                <p>Loading your registered events...</p>
            ) : (
                <>
                    {message && <p role="status">{message}</p>}

                    {registrations.length > 0 && (
                        <div className="events-grid">
                            {registrations.map(registration => {
                                const event = registration.event;

                                return (
                                    <div
                                        className="event-card"
                                        key={registration.id}
                                    >
                                        {event ? (
                                            <>
                                                <h3>{event.title}</h3>

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
                                            </>
                                        ) : (
                                            <p>Event details are unavailable.</p>
                                        )}

                                        <p>
                                            <strong>Registration Status:</strong>{" "}
                                            {registration.status || "REGISTERED"}
                                        </p>

                                        <button
                                            onClick={() =>
                                                handleCancel(registration.id)
                                            }
                                        >
                                            Cancel Registration
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

export default MyEvents;