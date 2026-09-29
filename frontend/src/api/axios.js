import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    headers: {
        "Content-Type": "application/json",
    },
});


// ============================================================
// REQUEST INTERCEPTOR
// Automatically attach JWT access token
// ============================================================

api.interceptors.request.use(
    (config) => {

        const token =
            localStorage.getItem("access_token");

        if (token) {

            config.headers = config.headers || {};

            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);


// ============================================================
// RESPONSE INTERCEPTOR
// If access token is invalid/expired, clear session
// ============================================================

api.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {

        if (error.response?.status === 401) {

            const requestUrl =
                error.config?.url || "";

            // Don't immediately clear tokens when
            // the login request itself fails.
            if (!requestUrl.includes("/auth/login/")) {

                localStorage.removeItem(
                    "access_token"
                );

                localStorage.removeItem(
                    "refresh_token"
                );

                localStorage.removeItem(
                    "user"
                );
            }
        }

        return Promise.reject(error);
    }
);


export default api;