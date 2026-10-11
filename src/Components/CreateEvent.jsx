import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

function CreateEvent() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [venue, setVenue] = useState("");
    const [capacity, setCapacity] = useState("");
    const [categoryId, setCategoryId] = useState("");

    const [categories, setCategories] = useState([]);
    const [message, setMessage] = useState("");
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Load categories
    useEffect(() => {
        async function loadCategories() {
            try {
                const response = await apiFetch("/api/categories");

                if (!response.ok) {
                    throw new Error(
                        `Could not load categories (HTTP ${response.status}).`
                    );
                }

                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
                setMessage(error.message || "Could not load categories.");
            } finally {
                setLoadingCategories(false);
            }
        }

        loadCategories();
    }, []);

    // Create event
    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");

        const token = localStorage.getItem("token");
        const user = JSON.parse(
            localStorage.getItem("user") || "null"
        );

        if (!token || !user) {
            navigate("/login", { replace: true });
            return;
        }

        if (
            user.role !== "ORGANIZER" &&
            user.role !== "ADMIN"
        ) {
            setMessage("Only organizers or admins can create events.");
            return;
        }

        if (!categoryId) {
            setMessage("Please select a category.");
            return;
        }

        const newEvent = {
            title: title.trim(),
            description: description.trim(),
            date,
            time,
            venue: venue.trim(),
            capacity: Number(capacity),
            category: {
                id: Number(categoryId)
            },
            // New events must wait for admin approval
            status: "PENDING"
        };

        setSubmitting(true);

        try {
            const response = await apiFetch("/api/events", {
                method: "POST",
                body: JSON.stringify(newEvent)
            });

            if (!response.ok) {
                const errorText = await response.text();

                console.error(
                    "Create event failed:",
                    response.status,
                    errorText
                );

                throw new Error(
                    `Failed to create event (HTTP ${response.status}). ${
                        errorText || ""
                    }`
                );
            }

            setMessage(
                "Event created successfully! It is waiting for admin approval."
            );

            setTitle("");
            setDescription("");
            setDate("");
            setTime("");
            setVenue("");
            setCapacity("");
            setCategoryId("");
        } catch (error) {
            console.error("Create event error:", error);
            setMessage(
                error.message || "Could not connect to the server."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="home-container">
            <div className="event-card">
                <h2>Create Event</h2>

                <form onSubmit={handleSubmit}>
                    <p>
                        <label htmlFor="title">Title</label>
                        <br />
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </p>

                    <p>
                        <label htmlFor="description">Description</label>
                        <br />
                        <textarea
                            id="description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                        />
                    </p>

                    <p>
                        <label htmlFor="date">Date</label>
                        <br />
                        <input
                            id="date"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            required
                        />
                    </p>

                    <p>
                        <label htmlFor="time">Time</label>
                        <br />
                        <input
                            id="time"
                            type="time"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            required
                        />
                    </p>

                    <p>
                        <label htmlFor="venue">Venue</label>
                        <br />
                        <input
                            id="venue"
                            type="text"
                            value={venue}
                            onChange={e => setVenue(e.target.value)}
                            required
                        />
                    </p>

                    <p>
                        <label htmlFor="capacity">Capacity</label>
                        <br />
                        <input
                            id="capacity"
                            type="number"
                            value={capacity}
                            onChange={e => setCapacity(e.target.value)}
                            min="1"
                            required
                        />
                    </p>

                    <p>
                        <label htmlFor="category">Category</label>
                        <br />

                        <select
                            id="category"
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            required
                            disabled={loadingCategories}
                        >
                            <option value="">
                                {loadingCategories
                                    ? "Loading categories..."
                                    : "Select Category"}
                            </option>

                            {categories.map(category => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </p>

                    <button
                        type="submit"
                        disabled={submitting || loadingCategories}
                    >
                        {submitting ? "Creating..." : "Create Event"}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/organizer/events")}
                    >
                        Back to Dashboard
                    </button>
                </form>

                {message && (
                    <p role="status" aria-live="polite">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}

export default CreateEvent;