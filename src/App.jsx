import { useCallback, useEffect, useState } from "react";
import {
    Routes,
    Route,
    Navigate,
    useNavigate
} from "react-router-dom";

import EventCard from "./Components/EventCard";
import MyEvents from "./Components/MyEvents";
import EventDetailsPage from "./Components/EventDetailsPage";
import CreateEvent from "./Components/CreateEvent";
import EditEvent from "./Components/EditEvent";
import OrganizerEvents from "./Components/OrganizerEvents";
import Login from "./Components/Login";
import AdminDashboard from "./Components/AdminDashboard";
import Signup from "./Components/Signup";

import "./App.css";

function HomePage({ events, loading, error, refreshEvents }) {
    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    }

    return (
        <div className="home-container">
            <header className="dashboard-header">
                <div>
                    <h1>EventHub</h1>
                    <p>Discover and register for college events.</p>
                    <p>Welcome, {user?.name || "Student"}!</p>
                </div>

                <button onClick={logout}>Logout</button>
            </header>

            <hr />

            <div>
                <h2>College Events</h2>

                <button
                    onClick={refreshEvents}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Refresh Events"}
                </button>
            </div>

            {error && <p role="alert">{error}</p>}

            {loading ? (
                <p>Loading approved events...</p>
            ) : events.length === 0 ? (
                <p>No approved events available right now.</p>
            ) : (
                events.map(event => (
                    <EventCard
                        key={event.id}
                        id={event.id}
                        title={event.title}
                        date={event.date}
                        venue={event.venue}
                    />
                ))
            )}

            <hr />

            <MyEvents />
        </div>
    );
}

function App() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const refreshEvents = useCallback(() => {
        setRefreshKey(previous => previous + 1);
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadApprovedEvents() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(
                    "https://eventhub-backend-g8zk.onrender.com/api/events/approved",
                    { cache: "no-store" }
                );

                if (!response.ok) {
                    throw new Error(
                        `Could not load events (HTTP ${response.status}).`
                    );
                }

                const data = await response.json();

                if (!cancelled) {
                    setEvents(data);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error(
                        "Error loading approved events:",
                        err
                    );

                    setError(
                        err.message ||
                        "Could not load approved events."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadApprovedEvents();

        return () => {
            cancelled = true;
        };
    }, [refreshKey]);

    return (
        <Routes>
            {/* Redirect the homepage to Login */}
            <Route
                path="/"
                element={<Navigate to="/login" replace />}
            />

            {/* Login and Signup */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* EventHub Homepage */}
            <Route
                path="/home"
                element={
                    <HomePage
                        events={events}
                        loading={loading}
                        error={error}
                        refreshEvents={refreshEvents}
                    />
                }
            />

            {/* Other existing pages */}
            <Route
                path="/events/:id"
                element={<EventDetailsPage />}
            />

            <Route
                path="/create-event"
                element={<CreateEvent />}
            />

            <Route
                path="/edit-event/:id"
                element={<EditEvent />}
            />

            <Route
                path="/organizer/events"
                element={<OrganizerEvents />}
            />

            <Route
                path="/admin/dashboard"
                element={<AdminDashboard />}
            />
        </Routes>
    );
}

export default App;