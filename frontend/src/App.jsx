import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentManagement from "./pages/StudentManagement";
import EnrollmentManagement from "./pages/EnrollmentManagement";


// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute({ children, allowedRoles }) {

    const userData = localStorage.getItem("user");

    if (!userData) {
        return <Navigate to="/login" replace />;
    }

    let user;

    try {
        user = JSON.parse(userData);
    } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        return <Navigate to="/login" replace />;
    }

    if (
        allowedRoles &&
        !allowedRoles.includes(user.role)
    ) {
        if (user.role === "ADMIN") {
            return <Navigate to="/admin/dashboard" replace />;
        }

        if (user.role === "TEACHER") {
            return <Navigate to="/teacher/dashboard" replace />;
        }

        if (user.role === "STUDENT") {
            return <Navigate to="/student/dashboard" replace />;
        }

        return <Navigate to="/login" replace />;
    }

    return children;
}


// ============================================================
// APP
// ============================================================

function App() {

    return (
        <BrowserRouter>

            <AuthProvider>

                <Routes>

                    {/* ==================================================
                        LOGIN
                    ================================================== */}

                    <Route
                        path="/login"
                        element={<Login />}
                    />


                    {/* ==================================================
                        STUDENT DASHBOARD
                    ================================================== */}

                    <Route
                        path="/student/dashboard"
                        element={
                            <ProtectedRoute
                                allowedRoles={["STUDENT"]}
                            >
                                <StudentDashboard />
                            </ProtectedRoute>
                        }
                    />


                    {/* ==================================================
                        TEACHER DASHBOARD
                    ================================================== */}

                    <Route
                        path="/teacher/dashboard"
                        element={
                            <ProtectedRoute
                                allowedRoles={["TEACHER"]}
                            >
                                <TeacherDashboard />
                            </ProtectedRoute>
                        }
                    />


                    {/* ==================================================
                        TEACHER STUDENT MANAGEMENT
                    ================================================== */}

                    <Route
                        path="/teacher/students"
                        element={
                            <ProtectedRoute
                                allowedRoles={["TEACHER"]}
                            >
                                <StudentManagement />
                            </ProtectedRoute>
                        }
                    />


                    {/* ==================================================
                        ADMIN DASHBOARD
                    ================================================== */}

                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute
                                allowedRoles={["ADMIN"]}
                            >
                                <div
                                    style={{
                                        padding: "40px",
                                        fontFamily: "Arial, sans-serif",
                                    }}
                                >
                                    <h1>
                                        Admin Dashboard
                                    </h1>

                                    <p>
                                        Admin dashboard is
                                        under construction.
                                    </p>
                                </div>
                            </ProtectedRoute>
                        }
                    />


                    {/* ==================================================
                        ADMIN ENROLLMENT MANAGEMENT
                    ================================================== */}

                    <Route
                        path="/admin/enrollments"
                        element={
                            <ProtectedRoute
                                allowedRoles={["ADMIN"]}
                            >
                                <EnrollmentManagement />
                            </ProtectedRoute>
                        }
                    />


                    {/* ==================================================
                        DEFAULT ROUTE
                    ================================================== */}

                    <Route
                        path="/"
                        element={
                            <Navigate
                                to="/login"
                                replace
                            />
                        }
                    />


                    {/* ==================================================
                        404
                    ================================================== */}

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/login"
                                replace
                            />
                        }
                    />

                </Routes>

            </AuthProvider>

        </BrowserRouter>
    );
}

export default App;