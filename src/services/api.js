const API_URL = "https://eventhub-backend-g8zk.onrender.com";

export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    const url = API_URL + endpoint;

    return fetch(url, {
        ...options,
        headers
    });
}