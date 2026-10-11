import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

function EventCard(props) {
    const [registered, setRegistered] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    const isStudent = user?.role === "STUDENT";

    // Check whether the student has already registered
    useEffect(() => {
        let cancelled = false;

        async function checkRegistration() {
            const token = localStorage.getItem("token");

            const currentUser = JSON.parse(
                localStorage.getItem("user") || "null"
            );

            if (
                !token ||
                !currentUser ||
                currentUser.role !== "STUDENT"
            ) {
                return;
            }

            try {
                const response = await apiFetch(
                    `/api/registrations/student/${currentUser.id}`
                );

                if (!response.ok) {
                    return;
                }

                const registrations = await response.json();

                const alreadyRegistered = registrations.some(
                    registration =>
                        Number(registration.event?.id) ===
                            Number(props.id) &&
                        registration.status === "REGISTERED"
                );

                if (!cancelled) {
                    setRegistered(alreadyRegistered);
                }
            } catch (error) {
                console.error(
                    "Could not check registration:",
                    error
                );
            }
        }

        checkRegistration();

        return () => {
            cancelled = true;
        };
    }, [props.id]);

    // Register for the event
    async function handleRegister() {
        setMessage("");

        const token = localStorage.getItem("token");

        const currentUser = JSON.parse(
            localStorage.getItem("user") || "null"
        );

        if (!token || !currentUser) {
            navigate("/login");
            return;
        }

        if (currentUser.role !== "STUDENT") {
            setMessage("Only students can register for events.");
            return;
        }

        if (registered || loading) {
            return;
        }

        setLoading(true);

        try {
            const response = await apiFetch(
                `/api/registrations/${currentUser.id}/${props.id}`,
                {
                    method: "POST"
                }
            );

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                setRegistered(true);
                setMessage("Registration successful!");
            } else if (response.status === 409) {
                setRegistered(true);

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

            setMessage("Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    // View event details
    function handleViewDetails() {
        navigate(`/events/${props.id}`);
    }

    return (
        <div className="event-card">
            <h2>{props.title}</h2>

            <p>
                <strong>Date:</strong>{" "}
                {props.date || "Not specified"}
            </p>

            <p>
                <strong>Venue:</strong>{" "}
                {props.venue || "Not specified"}
            </p>

            {isStudent && (
                <button
                    onClick={handleRegister}
                    disabled={registered || loading}
                >
                    {registered
                        ? "Registered ✓"
                        : loading
                        ? "Registering..."
                        : "Register"}
                </button>
            )}

            <button onClick={handleViewDetails}>
                View Details
            </button>

            {message && (
                <p role="status">
                    {message}
                </p>
            )}
        </div>
    );
}

export default EventCard;