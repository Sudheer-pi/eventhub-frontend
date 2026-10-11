import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";

function EditEvent() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [venue, setVenue] = useState("");
    const [capacity, setCapacity] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [status, setStatus] = useState("PENDING");

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            setLoading(true);
            setMessage("");

            try {
                const [eventResponse, categoryResponse] =
                    await Promise.all([
                        apiFetch(`/api/events/${id}`),
                        apiFetch("/api/categories")
                    ]);

                if (!eventResponse.ok) {
                    throw new Error("Could not load event details.");
                }

                if (!categoryResponse.ok) {
                    throw new Error("Could not load categories.");
                }

                const eventData = await eventResponse.json();
                const categoryData = await categoryResponse.json();

                if (cancelled) return;

                setTitle(eventData.title ?? "");
                setDescription(eventData.description ?? "");
                setDate(eventData.date ?? "");
                setTime(
                    eventData.time
                        ? String(eventData.time).slice(0, 5)
                        : ""
                );
                setVenue(eventData.venue ?? "");
                setCapacity(eventData.capacity ?? "");
                setCategoryId(
                    eventData.category?.id
                        ? String(eventData.category.id)
                        : ""
                );
                setStatus(
                    String(eventData.status ?? "PENDING").toUpperCase()
                );

                setCategories(
                    Array.isArray(categoryData) ? categoryData : []
                );
            } catch (error) {
                console.error("Error loading edit page:", error);

                if (!cancelled) {
                    setMessage(
                        error.message || "Could not load event."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => {
            cancelled = true;
        };
    }, [id]);

    async function handleUpdate(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");

        const updatedEvent = {
            title: title.trim(),
            description: description.trim(),
            date,
            time,
            venue: venue.trim(),
            capacity: Number(capacity),
            category: {
                id: Number(categoryId)
            },
            status
        };

        try {
            const response = await apiFetch(`/api/events/${id}`, {
                method: "PUT",
                body: JSON.stringify(updatedEvent)
            });

            if (response.ok) {
                setMessage("Event updated successfully!");

                setTimeout(() => {
                    navigate("/organizer/events");
                }, 800);
            } else {
                const errorText = await response.text();

                console.error("Update failed:", errorText);

                setMessage(
                    `Failed to update event (HTTP ${response.status}).`
                );
            }
        } catch (error) {
            console.error("Update event error:", error);
            setMessage("Could not connect to the server.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="event-card">
                <h2>Edit Event</h2>
                <p>Loading event details...</p>
            </div>
        );
    }

    return (
        <div className="event-card">
            <h2>Edit Event</h2>

            {message && (
                <p role="status">{message}</p>
            )}

            <form onSubmit={handleUpdate}>
                <p>
                    <label>Title</label>
                    <br />
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                </p>

                <p>
                    <label>Description</label>
                    <br />
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                    />
                </p>

                <p>
                    <label>Date</label>
                    <br />
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        required
                    />
                </p>

                <p>
                    <label>Time</label>
                    <br />
                    <input
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        required
                    />
                </p>

                <p>
                    <label>Venue</label>
                    <br />
                    <input
                        type="text"
                        value={venue}
                        onChange={e => setVenue(e.target.value)}
                        required
                    />
                </p>

                <p>
                    <label>Capacity</label>
                    <br />
                    <input
                        type="number"
                        value={capacity}
                        onChange={e => setCapacity(e.target.value)}
                        min="1"
                        required
                    />
                </p>

                <p>
                    <label>Category</label>
                    <br />
                    <select
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                        required
                    >
                        <option value="">Select Category</option>

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

                <p>
                    <label>Status</label>
                    <br />
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        required
                    >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                    </select>
                </p>

                <button type="submit" disabled={saving}>
                    {saving ? "Updating..." : "Update Event"}
                </button>

                <button
                    type="button"
                    onClick={() => navigate("/organizer/events")}
                    disabled={saving}
                >
                    Cancel
                </button>
            </form>
        </div>
    );
}

export default EditEvent;