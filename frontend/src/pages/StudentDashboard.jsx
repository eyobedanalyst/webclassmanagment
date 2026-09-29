import {
    useEffect,
    useState,
} from "react";

import {
    useAuth,
} from "../context/AuthContext";

import api from "../api/axios";

import Loading from "../components/Loading";

import ApiError from "../components/ApiError";


function StudentDashboard() {

    const {
        user,
        logout,
    } = useAuth();


    const [
        student,
        setStudent
    ] = useState(null);


    const [
        classes,
        setClasses
    ] = useState([]);


    const [
        subjects,
        setSubjects
    ] = useState([]);


    const [
        teachers,
        setTeachers
    ] = useState([]);


    const [
        results,
        setResults
    ] = useState([]);


    const [
        summary,
        setSummary
    ] = useState({
        total_results: 0,
        average_percentage: 0,
        passed: 0,
        failed: 0,
    });


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        error,
        setError
    ] = useState("");


    useEffect(() => {

        loadDashboard();

    }, []);


    async function loadDashboard() {

        setLoading(true);

        setError("");


        try {

            const [
                studentResponse,
                classesResponse,
                subjectsResponse,
                teachersResponse,
                resultsResponse,
                summaryResponse,
            ] = await Promise.all([

                api.get(
                    "/students/me/"
                ),

                api.get(
                    "/classes/my-classes/"
                ),

                api.get(
                    "/subjects/my-subjects/"
                ),

                api.get(
                    "/auth/teachers/"
                ),

                api.get(
                    "/results/my-results/"
                ),

                api.get(
                    "/results/summary/"
                ),

            ]);


            setStudent(
                studentResponse.data
            );


            setClasses(
                classesResponse.data
            );


            setSubjects(
                subjectsResponse.data
            );


            setTeachers(
                teachersResponse.data
            );


            setResults(
                resultsResponse.data
            );


            setSummary(
                summaryResponse.data
            );


        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );


            if (
                error.response?.status === 401
            ) {

                logout();

                return;
            }


            setError(
                "Could not load your dashboard data. "
                + "Please make sure the Django server is running."
            );

        } finally {

            setLoading(false);

        }
    }


    if (loading) {

        return (
            <Loading
                message="Loading your dashboard..."
            />
        );
    }


    if (error) {

        return (

            <div className="dashboard-page">

                <header className="dashboard-header">

                    <div>
                        <h1>
                            Student Dashboard
                        </h1>
                    </div>

                    <button
                        onClick={logout}
                        className="logout-button"
                    >
                        Logout
                    </button>

                </header>


                <main className="dashboard-content">

                    <ApiError
                        message={error}
                    />

                </main>

            </div>
        );
    }


    return (

        <div className="dashboard-page">

            {/* =========================
                HEADER
            ========================= */}

            <header className="dashboard-header">

                <div className="dashboard-brand">

                    <div className="dashboard-logo">
                        SMS
                    </div>

                    <div>

                        <h1>
                            Student Dashboard
                        </h1>

                        <p>
                            Student Management System
                        </p>

                    </div>

                </div>


                <div className="dashboard-user">

                    <span>
                        {user?.first_name}{" "}
                        {user?.last_name}
                    </span>

                    <button
                        onClick={logout}
                        className="logout-button"
                    >
                        Logout
                    </button>

                </div>

            </header>


            <main className="dashboard-content">

                {/* =========================
                    WELCOME
                ========================= */}

                <section className="welcome-section">

                    <div>

                        <p className="welcome-label">
                            Welcome back
                        </p>

                        <h2>
                            {student?.full_name ||
                                `${user?.first_name} ${user?.last_name}`
                            }
                        </h2>

                        <p>
                            Student Code:{" "}
                            <strong>
                                {student?.student_code}
                            </strong>
                        </p>

                    </div>


                    <div className="student-code-card">

                        <span>
                            Student Code
                        </span>

                        <strong>
                            {student?.student_code}
                        </strong>

                    </div>

                </section>


                {/* =========================
                    STATISTICS
                ========================= */}

                <section className="stats-grid">

                    <StatCard
                        title="My Class"
                        value={
                            classes.length > 0
                                ? classes[0].name
                                : "Not assigned"
                        }
                        icon="🏫"
                    />


                    <StatCard
                        title="Subjects"
                        value={subjects.length}
                        icon="📚"
                    />


                    <StatCard
                        title="Average"
                        value={`${summary.average_percentage}%`}
                        icon="📊"
                    />


                    <StatCard
                        title="Results"
                        value={summary.total_results}
                        icon="📝"
                    />

                </section>


                {/* =========================
                    MAIN GRID
                ========================= */}

                <section className="dashboard-grid">

                    {/* PROFILE */}

                    <div className="dashboard-card">

                        <div className="card-header">

                            <div>

                                <h3>
                                    My Profile
                                </h3>

                                <p>
                                    Personal information
                                </p>

                            </div>

                            <span className="card-icon">
                                👤
                            </span>

                        </div>


                        <div className="profile-details">

                            <ProfileRow
                                label="Full Name"
                                value={
                                    student?.full_name
                                }
                            />

                            <ProfileRow
                                label="Username"
                                value={
                                    student?.username
                                }
                            />

                            <ProfileRow
                                label="Email"
                                value={
                                    student?.email ||
                                    "Not provided"
                                }
                            />

                            <ProfileRow
                                label="Gender"
                                value={
                                    getGender(
                                        student?.gender
                                    )
                                }
                            />

                            <ProfileRow
                                label="Phone"
                                value={
                                    student?.phone ||
                                    "Not provided"
                                }
                            />

                            <ProfileRow
                                label="Guardian"
                                value={
                                    student?.guardian_name ||
                                    "Not provided"
                                }
                            />

                        </div>

                    </div>


                    {/* CLASSES */}

                    <div className="dashboard-card">

                        <div className="card-header">

                            <div>

                                <h3>
                                    My Classes
                                </h3>

                                <p>
                                    Current enrollment
                                </p>

                            </div>

                            <span className="card-icon">
                                🏫
                            </span>

                        </div>


                        <div className="class-list">

                            {classes.length === 0 ? (

                                <EmptyState
                                    message="No class assigned."
                                />

                            ) : (

                                classes.map(
                                    (classroom) => (

                                        <div
                                            className="class-item"
                                            key={classroom.id}
                                        >

                                            <div>

                                                <strong>
                                                    {classroom.name}
                                                </strong>

                                                <span>
                                                    Grade{" "}
                                                    {classroom.grade}
                                                    {" • "}
                                                    Section{" "}
                                                    {classroom.section}
                                                </span>

                                            </div>


                                            <span className="active-badge">
                                                Active
                                            </span>

                                        </div>

                                    )
                                )

                            )}

                        </div>

                    </div>


                    {/* SUBJECTS */}

                    <div className="dashboard-card">

                        <div className="card-header">

                            <div>

                                <h3>
                                    My Subjects
                                </h3>

                                <p>
                                    Subjects you study
                                </p>

                            </div>

                            <span className="card-icon">
                                📚
                            </span>

                        </div>


                        <div className="subject-list">

                            {subjects.length === 0 ? (

                                <EmptyState
                                    message="No subjects found."
                                />

                            ) : (

                                subjects.map(
                                    (subject) => (

                                        <div
                                            className="subject-item"
                                            key={subject.id}
                                        >

                                            <div className="subject-icon">
                                                {getSubjectInitial(
                                                    subject.name
                                                )}
                                            </div>

                                            <div>

                                                <strong>
                                                    {subject.name}
                                                </strong>

                                                <span>
                                                    {subject.code}
                                                </span>

                                            </div>

                                        </div>

                                    )
                                )

                            )}

                        </div>

                    </div>


                    {/* TEACHERS */}

                    <div className="dashboard-card">

                        <div className="card-header">

                            <div>

                                <h3>
                                    My Teachers
                                </h3>

                                <p>
                                    Teachers assigned to your class
                                </p>

                            </div>

                            <span className="card-icon">
                                👨‍🏫
                            </span>

                        </div>


                        <div className="teacher-list">

                            {teachers.length === 0 ? (

                                <EmptyState
                                    message="No teachers found."
                                />

                            ) : (

                                teachers.map(
                                    (teacher) => (

                                        <div
                                            className="teacher-item"
                                            key={teacher.id}
                                        >

                                            <div className="teacher-avatar">
                                                {getInitials(
                                                    teacher.full_name
                                                )}
                                            </div>

                                            <div>

                                                <strong>
                                                    {
                                                        teacher.full_name
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        teacher.email ||
                                                        "Teacher"
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                    )
                                )

                            )}

                        </div>

                    </div>

                </section>


                {/* =========================
                    RESULTS
                ========================= */}

                <section className="dashboard-card results-card">

                    <div className="card-header">

                        <div>

                            <h3>
                                My Results
                            </h3>

                            <p>
                                Your academic performance
                            </p>

                        </div>

                        <span className="card-icon">
                            📊
                        </span>

                    </div>


                    <div className="result-summary">

                        <SummaryItem
                            label="Average"
                            value={`${summary.average_percentage}%`}
                        />

                        <SummaryItem
                            label="Passed"
                            value={summary.passed}
                        />

                        <SummaryItem
                            label="Failed"
                            value={summary.failed}
                        />

                        <SummaryItem
                            label="Total"
                            value={summary.total_results}
                        />

                    </div>


                    <div className="results-table-wrapper">

                        {results.length === 0 ? (

                            <EmptyState
                                message="No results available yet."
                            />

                        ) : (

                            <table className="results-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Subject
                                        </th>

                                        <th>
                                            Type
                                        </th>

                                        <th>
                                            Title
                                        </th>

                                        <th>
                                            Score
                                        </th>

                                        <th>
                                            Percentage
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {results.map(
                                        (result) => (

                                            <tr
                                                key={
                                                    result.id
                                                }
                                            >

                                                <td>
                                                    <strong>
                                                        {
                                                            result.subject_name
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            result.subject_name
                                                        }
                                                    </small>
                                                </td>


                                                <td>
                                                    {
                                                        formatExamType(
                                                            result.exam_type
                                                        )
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        result.title ||
                                                        "-"
                                                    }
                                                </td>


                                                <td>
                                                    <strong>
                                                        {
                                                            result.score
                                                        }
                                                    </strong>
                                                    {" / "}
                                                    {
                                                        result.max_score
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        result.percentage
                                                    }%
                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            result.status === "PASS"
                                                                ? "status-badge pass"
                                                                : "status-badge fail"
                                                        }
                                                    >
                                                        {
                                                            result.status
                                                        }
                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        )}

                    </div>

                </section>

            </main>

        </div>
    );
}


/* =========================
   STAT CARD
========================= */

function StatCard({
    title,
    value,
    icon,
}) {

    return (

        <div className="stat-card">

            <div className="stat-icon">
                {icon}
            </div>

            <div>

                <span>
                    {title}
                </span>

                <strong>
                    {value}
                </strong>

            </div>

        </div>
    );
}


/* =========================
   PROFILE ROW
========================= */

function ProfileRow({
    label,
    value,
}) {

    return (

        <div className="profile-row">

            <span>
                {label}
            </span>

            <strong>
                {value || "Not provided"}
            </strong>

        </div>
    );
}


/* =========================
   SUMMARY ITEM
========================= */

function SummaryItem({
    label,
    value,
}) {

    return (

        <div className="summary-item">

            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>

        </div>
    );
}


/* =========================
   EMPTY STATE
========================= */

function EmptyState({
    message,
}) {

    return (

        <div className="empty-state">

            <span>
                📭
            </span>

            <p>
                {message}
            </p>

        </div>
    );
}


/* =========================
   HELPERS
========================= */

function getGender(gender) {

    if (gender === "M") {
        return "Male";
    }

    if (gender === "F") {
        return "Female";
    }

    if (gender === "O") {
        return "Other";
    }

    return "Not provided";
}


function getInitials(name) {

    if (!name) {
        return "T";
    }


    return name
        .split(" ")
        .map(
            (word) =>
                word.charAt(0)
        )
        .slice(0, 2)
        .join("")
        .toUpperCase();
}


function getSubjectInitial(name) {

    if (!name) {
        return "S";
    }

    return name
        .charAt(0)
        .toUpperCase();
}


function formatExamType(type) {

    if (!type) {
        return "-";
    }


    return type
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            (letter) =>
                letter.toUpperCase()
        );
}


export default StudentDashboard;