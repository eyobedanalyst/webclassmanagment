import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import api from "../api/axios";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);


    // ========================================================
    // CHECK EXISTING LOGIN
    // ========================================================

    useEffect(() => {

        loadCurrentUser();

    }, []);


    async function loadCurrentUser() {

        const accessToken =
            localStorage.getItem("access_token");


        if (!accessToken) {

            setLoading(false);

            return;
        }


        try {

            const response =
                await api.get("/auth/me/");


            const currentUser =
                response.data.user;


            setUser(currentUser);


            localStorage.setItem(
                "user",
                JSON.stringify(currentUser)
            );

        } catch (error) {

            console.error(
                "Could not verify session:",
                error
            );


            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            localStorage.removeItem(
                "user"
            );

            setUser(null);

        } finally {

            setLoading(false);

        }
    }


    // ========================================================
    // LOGIN
    // ========================================================

    async function login(username, password) {

        const response =
            await api.post(
                "/auth/login/",
                {
                    username,
                    password,
                }
            );


        console.log(
            "LOGIN RESPONSE:",
            response.data
        );


        const {
            access,
            refresh,
            user,
        } = response.data;


        // Make sure the backend actually
        // returned the JWT access token.

        if (!access) {

            throw new Error(
                "Login succeeded, but no access token was returned."
            );
        }


        // Save JWT tokens FIRST

        localStorage.setItem(
            "access_token",
            access
        );


        localStorage.setItem(
            "refresh_token",
            refresh
        );


        // Save user information

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );


        // Update React state

        setUser(user);


        return user;
    }


    // ========================================================
    // LOGOUT
    // ========================================================

    function logout() {

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "refresh_token"
        );

        localStorage.removeItem(
            "user"
        );

        setUser(null);
    }


    return (

        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >

            {children}

        </AuthContext.Provider>

    );
}


export function useAuth() {

    return useContext(AuthContext);

}