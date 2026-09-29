import {
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    useAuth,
} from "../context/AuthContext";


function Login() {

    const navigate = useNavigate();

    const {
        login,
    } = useAuth();


    const [
        username,
        setUsername
    ] = useState("");


    const [
        password,
        setPassword
    ] = useState("");


    const [
        error,
        setError
    ] = useState("");


    const [
        submitting,
        setSubmitting
    ] = useState(false);


    async function handleSubmit(event) {

        event.preventDefault();

        setError("");

        setSubmitting(true);


        try {

            const user = await login(
                username,
                password
            );


            if (user.role === "ADMIN") {

                navigate(
                    "/admin",
                    { replace: true }
                );

            } else if (
                user.role === "TEACHER"
            ) {

                navigate(
                    "/teacher",
                    { replace: true }
                );

            } else if (
                user.role === "STUDENT"
            ) {

                navigate(
                    "/student",
                    { replace: true }
                );

            } else {

                setError(
                    "Your account has an unknown role."
                );
            }


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            if (
                error.response?.status === 401
            ) {

                setError(
                    "Invalid username or password."
                );

            } else {

                setError(
                    "Could not connect to the server."
                );
            }

        } finally {

            setSubmitting(false);
        }
    }


    return (

        <div className="login-page">

            <div className="login-card">

                <div className="login-header">

                    <div className="login-logo">
                        SMS
                    </div>

                    <h1>
                        Student Management System
                    </h1>

                    <p>
                        Sign in to continue
                    </p>

                </div>


                <form
                    onSubmit={handleSubmit}
                    className="login-form"
                >

                    <div className="form-group">

                        <label htmlFor="username">
                            Username
                        </label>

                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(event) =>
                                setUsername(
                                    event.target.value
                                )
                            }
                            placeholder="Enter your username"
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Enter your password"
                            required
                        />

                    </div>


                    {error && (

                        <div className="login-error">
                            {error}
                        </div>

                    )}


                    <button
                        type="submit"
                        disabled={submitting}
                        className="login-button"
                    >

                        {submitting
                            ? "Signing in..."
                            : "Sign In"
                        }

                    </button>

                </form>


                <div className="login-footer">

                    Student Management System

                </div>

            </div>

        </div>
    );
}


export default Login;