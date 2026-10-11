function EventDetails(props) {

    return (
        <div className="event-card">

            <h2>{props.title}</h2>

            <p>
                <strong>Description:</strong> {props.description}
            </p>

            <p>
                <strong>Date:</strong> {props.date}
            </p>

            <p>
                <strong>Time:</strong> {props.time}
            </p>

            <p>
                <strong>Venue:</strong> {props.venue}
            </p>

            <p>
                <strong>Category:</strong> {props.category}
            </p>

            <p>
                <strong>Capacity:</strong> {props.capacity}
            </p>

            <p>
                <strong>Status:</strong> {props.status}
            </p>

        </div>
    );
}

export default EventDetails;