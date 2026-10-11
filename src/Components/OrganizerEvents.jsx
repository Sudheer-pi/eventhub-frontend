import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

function OrganizerEvents() {
    const [events, setEvents] = useState([]);
    const [registrationCounts, setRegistrationCounts] = useState({});
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    // Load events and registration counts
    const loadEvents = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await apiFetch("/api/events");

            if (!response.ok) {
                throw new Error(
                    `Could not load events (HTTP ${response.status}).`
                );
            }

            const data = await response.json();
            setEvents(data);

            // Fetch registration counts for each event
            const counts = {};

            await Promise.all(
                data.map(async event => {
                    try {
                        const countResponse = await apiFetch(
                            `/api/registrations/event/${event.id}/count`
                        );

                        if (countResponse.ok) {
                            counts[event.id] = await countResponse.json();
                        } else {
                            counts[event.id] = null;
                        }
                    } catch {
                        counts[event.id] = null;
                    }
                })
            );

            setRegistrationCounts(counts);
        } catch (error) {
            console.error("Error fetching events:", error);
            setError(error.message || "Could not load events.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    // Logout
    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    }

    // Create event
    function handleCreate() {
        navigate("/create-event");
    }

    // Edit event
    function handleEdit(eventId) {
        navigate(`/edit-event/${eventId}`);
    }

    // Delete event
    async function handleDelete(eventId) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this event?"
        );

        if (!confirmed) return;

        try {
            const response = await apiFetch(
                `/api/events/${eventId}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                throw new Error(
                    `Could not delete event (HTTP ${response.status}).`
                );
            }

            setEvents(previous =>
                previous.filter(event => event.id !== eventId)
            );

            setRegistrationCounts(previous => {
                const updated = { ...previous };
                delete updated[eventId];
                return updated;
            });

            if (selectedEvent?.id === eventId) {
                setSelectedEvent(null);
                setStudents([]);
            }

            alert("Event deleted successfully!");
        } catch (error) {
            console.error("Delete event error:", error);
            alert(error.message || "Could not delete event.");
        }
    }

    // View students registered for an event
    async function handleViewStudents(event) {
        setSelectedEvent(event);
        setStudents([]);
        setStudentsLoading(true);
        setError("");

        try {
            const response = await apiFetch(
                `/api/registrations/event/${event.id}`
            );

            if (!response.ok) {
                throw new Error(
                    `Could not load registrations (HTTP ${response.status}).`
                );
            }

            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error("Registration loading error:", error);
            setError(error.message || "Could not load registered students.");
        } finally {
            setStudentsLoading(false);
        }
    }

    // Statistics
    const approvedCount = events.filter(
        event => String(event.status).toUpperCase() === "APPROVED"
    ).length;

    const pendingCount = events.filter(
        event =>
            !event.status ||
            String(event.status).toUpperCase() === "PENDING"
    ).length;

    const rejectedCount = events.filter(
        event => String(event.status).toUpperCase() === "REJECTED"
    ).length;

    const totalRegistrations = Object.values(registrationCounts)
        .reduce(
            (total, count) =>
                total + (typeof count === "number" ? count : 0),
            0
        );

    function getStatusClass(status) {
        const normalized = String(status || "PENDING").toLowerCase();
        return `organizer-status organizer-status-${normalized}`;
    }

    return (
        <div className="home-container organizer-dashboard">

            {/* Header */}
            <header className="dashboard-header">
                <div>
                    <h1>EventHub Organizer Dashboard</h1>
                    <p>Manage your events and registrations.</p>
                </div>

                <div className="organizer-header-actions">
                    <button
                        onClick={loadEvents}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>

                    <button onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <hr />

            {error && (
                <div className="organizer-error" role="alert">
                    {error}
                </div>
            )}

            {/* Statistics */}
            <section className="organizer-section">
                <h2>Dashboard Overview</h2>

                <div className="organizer-stats">
                    <div className="organizer-stat-card">
                        <h3>Total Events</h3>
                        <p>{events.length}</p>
                    </div>

                    <div className="organizer-stat-card">
                        <h3>Approved</h3>
                        <p>{approvedCount}</p>
                    </div>

                    <div className="organizer-stat-card">
                        <h3>Pending</h3>
                        <p>{pendingCount}</p>
                    </div>

                    <div className="organizer-stat-card">
                        <h3>Rejected</h3>
                        <p>{rejectedCount}</p>
                    </div>

                    <div className="organizer-stat-card">
                        <h3>Total Registrations</h3>
                        <p>{totalRegistrations}</p>
                    </div>
                </div>
            </section>

            {/* Event management */}
            <section className="organizer-section">
                <div className="organizer-section-header">
                    <h2>Manage Events</h2>

                    <button
                        className="organizer-create-button"
                        onClick={handleCreate}
                    >
                        + Create Event
                    </button>
                </div>

                {loading ? (
                    <p>Loading events...</p>
                ) : events.length === 0 ? (
                    <p>No events available.</p>
                ) : (
                    <div className="organizer-events-grid">
                        {events.map(event => (
                            <article
                                className="organizer-event-card"
                                key={event.id}
                            >
                                <div className="organizer-event-heading">
                                    <h3>{event.title}</h3>

                                    <span
                                        className={getStatusClass(event.status)}
                                    >
                                        {event.status || "PENDING"}
                                    </span>
                                </div>

                                <p>
                                    <strong>Date:</strong>{" "}
                                    {event.date || "N/A"}
                                </p>

                                <p>
                                    <strong>Time:</strong>{" "}
                                    {event.time || "N/A"}
                                </p>

                                <p>
                                    <strong>Venue:</strong>{" "}
                                    {event.venue || "N/A"}
                                </p>

                                <p>
                                    <strong>Category:</strong>{" "}
                                    {event.category?.name || "N/A"}
                                </p>

                                <p>
                                    <strong>Capacity:</strong>{" "}
                                    {event.capacity ?? "N/A"}
                                </p>

                                <div className="organizer-registration-count">
                                    <span>Registered Students</span>

                                    <strong>
                                        {typeof registrationCounts[event.id] === "number"
                                            ? registrationCounts[event.id]
                                            : "Unavailable"}
                                    </strong>
                                </div>

                                <div className="organizer-event-actions">
                                    <button
                                        onClick={() => handleViewStudents(event)}
                                    >
                                        View Students
                                    </button>

                                    <button
                                        onClick={() => handleEdit(event.id)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="organizer-delete-button"
                                        onClick={() => handleDelete(event.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Registered students */}
            {selectedEvent && (
                <section className="organizer-section organizer-students-section">
                    <div className="organizer-section-header">
                        <div>
                            <h2>Registered Students</h2>
                            <p>
                                Event: <strong>{selectedEvent.title}</strong>
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setSelectedEvent(null);
                                setStudents([]);
                            }}
                        >
                            Close
                        </button>
                    </div>

                    {studentsLoading ? (
                        <p>Loading registered students...</p>
                    ) : students.length === 0 ? (
                        <p>No registrations found for this event.</p>
                    ) : (
                        <div className="organizer-table-container">
                            <table className="organizer-students-table">
                                <thead>
                                    <tr>
                                        <th>Registration ID</th>
                                        <th>Student Name</th>
                                        <th>Email</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {students.map(registration => (
                                        <tr key={registration.id}>
                                            <td>{registration.id}</td>

                                            <td>
                                                {registration.student?.name || "N/A"}
                                            </td>

                                            <td>
                                                {registration.student?.email || "N/A"}
                                            </td>

                                            <td>
                                                {registration.registrationDate
                                                    ? new Date(
                                                        registration.registrationDate
                                                    ).toLocaleString()
                                                    : "N/A"}
                                            </td>

                                            <td>
                                                {registration.status || "REGISTERED"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

export default OrganizerEvents;