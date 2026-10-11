import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

function AdminDashboard() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [eventFilter, setEventFilter] = useState("ALL");

    // Check login and admin role
    useEffect(() => {
        const token = localStorage.getItem("token");

        let currentUser = null;

        try {
            currentUser = JSON.parse(
                localStorage.getItem("user") || "null"
            );
        } catch {
            currentUser = null;
        }

        if (!token || !currentUser) {
            navigate("/login", { replace: true });
            return;
        }

        if (currentUser.role !== "ADMIN") {
            navigate("/", { replace: true });
        }
    }, [navigate]);

    // Load users and events
    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setMessage("");

        try {
            const [usersResponse, eventsResponse] = await Promise.all([
                apiFetch("/api/users"),
                apiFetch("/api/events")
            ]);

            if (!usersResponse.ok) {
                throw new Error(
                    `Could not load users (HTTP ${usersResponse.status}).`
                );
            }

            if (!eventsResponse.ok) {
                throw new Error(
                    `Could not load events (HTTP ${eventsResponse.status}).`
                );
            }

            const usersData = await usersResponse.json();
            const eventsData = await eventsResponse.json();

            // Do not display administrator accounts in user management
            setUsers(
                usersData.filter(
                    user =>
                        String(user.role).toUpperCase() !== "ADMIN"
                )
            );

            setEvents(eventsData);
        } catch (error) {
            console.error("Dashboard loading error:", error);

            setMessage(
                error.message || "Could not load dashboard."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch dashboard data after login verification
    useEffect(() => {
        let currentUser = null;

        try {
            currentUser = JSON.parse(
                localStorage.getItem("user") || "null"
            );
        } catch {
            currentUser = null;
        }

        if (
            localStorage.getItem("token") &&
            currentUser?.role === "ADMIN"
        ) {
            loadDashboard();
        }
    }, [loadDashboard]);

    // User statistics
    const studentCount = users.filter(
        user => String(user.role).toUpperCase() === "STUDENT"
    ).length;

    const organizerCount = users.filter(
        user => String(user.role).toUpperCase() === "ORGANIZER"
    ).length;

    // Event statistics
    const pendingCount = events.filter(
        event =>
            String(event.status || "PENDING").toUpperCase() === "PENDING"
    ).length;

    const approvedCount = events.filter(
        event =>
            String(event.status || "PENDING").toUpperCase() === "APPROVED"
    ).length;

    const rejectedCount = events.filter(
        event =>
            String(event.status || "PENDING").toUpperCase() === "REJECTED"
    ).length;

    // Filter events by status
    const filteredEvents = events.filter(event => {
        const status = String(
            event.status || "PENDING"
        ).toUpperCase();

        return eventFilter === "ALL" || status === eventFilter;
    });

    // Change user role
    async function handleRoleChange(userId, newRole) {
        const confirmed = window.confirm(
            `Change this user's role to ${newRole}?`
        );

        if (!confirmed) {
            return;
        }

        setProcessingId(userId);
        setMessage("");

        try {
            const response = await apiFetch(
                `/api/users/${userId}/role`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        role: newRole
                    })
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));

                throw new Error(
                    data.message ||
                    `Role update failed (HTTP ${response.status}).`
                );
            }

            setMessage("User role updated successfully.");

            await loadDashboard();
        } catch (error) {
            console.error("Role update error:", error);

            setMessage(
                error.message || "Could not update user role."
            );
        } finally {
            setProcessingId(null);
        }
    }

    // Approve or reject an event
    async function updateEventStatus(eventId, action) {
        const status =
            action === "approve" ? "APPROVED" : "REJECTED";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} this event?`
        );

        if (!confirmed) {
            return;
        }

        setProcessingId(eventId);
        setMessage("");

        try {
            const response = await apiFetch(
                `/api/events/${eventId}/status`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        status
                    })
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));

                throw new Error(
                    data.message ||
                    `Event status update failed (HTTP ${response.status}).`
                );
            }

            setMessage(
                status === "APPROVED"
                    ? "Event approved successfully."
                    : "Event rejected successfully."
            );

            await loadDashboard();
        } catch (error) {
            console.error("Event status update error:", error);

            setMessage(
                error.message || "Could not update event status."
            );
        } finally {
            setProcessingId(null);
        }
    }

    // Logout
    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
    }

    // Display event status
    function statusBadge(status) {
        const normalizedStatus = String(
            status || "PENDING"
        ).toUpperCase();

        return (
            <span
                className={`status-badge status-${normalizedStatus.toLowerCase()}`}
            >
                {normalizedStatus}
            </span>
        );
    }

    // Statistics card
    function StatCard({ title, value }) {
        return (
            <div className="admin-stat-card">
                <h3>{title}</h3>
                <p>{value}</p>
            </div>
        );
    }

    return (
        <div className="home-container admin-dashboard">

            {/* ===== HEADER ===== */}
            <header className="dashboard-header">
                <div className="dashboard-heading">
                    <h1>EventHub Admin Dashboard</h1>
                    <p>Manage users, events, and approvals.</p>
                </div>

                <div className="dashboard-actions">
                    <button
                        onClick={loadDashboard}
                        disabled={loading || processingId !== null}
                    >
                        {loading ? "Refreshing..." : "Refresh Dashboard"}
                    </button>

                    <button onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <hr />

            {/* ===== MESSAGE ===== */}
            {message && (
                <div
                    className="admin-message"
                    role="status"
                    aria-live="polite"
                >
                    {message}
                </div>
            )}

            {loading ? (
                <p className="admin-loading">
                    Loading dashboard...
                </p>
            ) : (
                <>

                    {/* ===== DASHBOARD STATISTICS ===== */}
                    <section className="admin-section">
                        <h2>Dashboard Overview</h2>

                        <div className="dashboard-stats">
                            <StatCard
                                title="Total Users"
                                value={users.length}
                            />

                            <StatCard
                                title="Students"
                                value={studentCount}
                            />

                            <StatCard
                                title="Organizers"
                                value={organizerCount}
                            />

                            <StatCard
                                title="Total Events"
                                value={events.length}
                            />

                            <StatCard
                                title="Pending"
                                value={pendingCount}
                            />

                            <StatCard
                                title="Approved"
                                value={approvedCount}
                            />

                            <StatCard
                                title="Rejected"
                                value={rejectedCount}
                            />
                        </div>
                    </section>

                    {/* ===== USER MANAGEMENT ===== */}
                    <section className="admin-section">
                        <h2>Manage Users</h2>

                        {users.length === 0 ? (
                            <p>No students or organizers found.</p>
                        ) : (
                            <div className="user-table-container">
                                <table className="user-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Current Role</th>
                                            <th>Change Role</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id}>
                                                <td>{user.id}</td>

                                                <td>{user.name}</td>

                                                <td>{user.email}</td>

                                                <td>
                                                    <span className="user-role">
                                                        {user.role}
                                                    </span>
                                                </td>

                                                <td>
                                                    <select
                                                        value={user.role}
                                                        disabled={
                                                            processingId === user.id
                                                        }
                                                        onChange={event =>
                                                            handleRoleChange(
                                                                user.id,
                                                                event.target.value
                                                            )
                                                        }
                                                        aria-label={`Change role for ${user.name}`}
                                                    >
                                                        <option value="STUDENT">
                                                            Student
                                                        </option>

                                                        <option value="ORGANIZER">
                                                            Organizer
                                                        </option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* ===== EVENT MANAGEMENT ===== */}
                    <section className="admin-section">
                        <h2>Manage Events</h2>

                        {/* Event status filters */}
                        <div className="event-filters">
                            {[
                                ["ALL", "All Events"],
                                ["PENDING", "Pending"],
                                ["APPROVED", "Approved"],
                                ["REJECTED", "Rejected"]
                            ].map(([value, label]) => {
                                const count =
                                    value === "ALL"
                                        ? events.length
                                        : value === "PENDING"
                                        ? pendingCount
                                        : value === "APPROVED"
                                        ? approvedCount
                                        : rejectedCount;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        className={
                                            eventFilter === value
                                                ? "active-filter"
                                                : ""
                                        }
                                        onClick={() =>
                                            setEventFilter(value)
                                        }
                                    >
                                        {label} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        {/* Event cards */}
                        {filteredEvents.length === 0 ? (
                            <div className="admin-empty-state">
                                <h3>No events found</h3>
                                <p>
                                    There are no events in this category.
                                </p>
                            </div>
                        ) : (
                            <div className="admin-events-grid">
                                {filteredEvents.map(event => {
                                    const status = String(
                                        event.status || "PENDING"
                                    ).toUpperCase();

                                    return (
                                        <article
                                            className="admin-event-card"
                                            key={event.id}
                                        >
                                            <div className="admin-event-card-header">
                                                <h3>{event.title}</h3>

                                                {statusBadge(status)}
                                            </div>

                                            <div className="admin-event-details">
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
                                            </div>

                                            <div className="admin-event-actions">
                                                {status !== "APPROVED" && (
                                                    <button
                                                        className="approve-button"
                                                        disabled={
                                                            processingId === event.id
                                                        }
                                                        onClick={() =>
                                                            updateEventStatus(
                                                                event.id,
                                                                "approve"
                                                            )
                                                        }
                                                    >
                                                        Approve
                                                    </button>
                                                )}

                                                {status !== "REJECTED" && (
                                                    <button
                                                        className="reject-button"
                                                        disabled={
                                                            processingId === event.id
                                                        }
                                                        onClick={() =>
                                                            updateEventStatus(
                                                                event.id,
                                                                "reject"
                                                            )
                                                        }
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                </>
            )}
        </div>
    );
}

export default AdminDashboard;