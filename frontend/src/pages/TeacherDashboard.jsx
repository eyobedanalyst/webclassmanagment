import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useAuth,
} from "../context/AuthContext";

import api from "../api/axios";

import Loading from "../components/Loading";
import ApiError from "../components/ApiError";

import "./TeacherDashboard.css";
import { useNavigate } from "react-router-dom";

function TeacherDashboard() {
    const navigate = useNavigate();

    const {
        user,
        logout,
    } = useAuth();


    /* --------------------------------
       MAIN DATA
    -------------------------------- */

    const [teacher, setTeacher] = useState(null);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [results, setResults] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [currentAcademicYear, setCurrentAcademicYear] =
        useState(null);


    /* --------------------------------
       UI STATE
    -------------------------------- */

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refresh, setRefresh] = useState(0);

    const [showResultForm, setShowResultForm] =
        useState(false);

    const [editingResult, setEditingResult] =
        useState(null);


    /* --------------------------------
       RESULT FILTERS
    -------------------------------- */

    const [resultFilters, setResultFilters] = useState({
        classroom: "",
        subject: "",
        semester: "",
        exam_type: "",
        search: "",
    });

    const [resultLoading, setResultLoading] =
        useState(false);


    /* --------------------------------
       LOAD DASHBOARD
    -------------------------------- */

    useEffect(() => {
        loadTeacherDashboard();
    }, [refresh]);


    async function loadTeacherDashboard() {

        setLoading(true);
        setError("");

        try {

            const [
                teacherResponse,
                classesResponse,
                subjectsResponse,
                studentsResponse,
                resultsResponse,
                assignmentsResponse,
                academicYearResponse,
            ] = await Promise.all([

                api.get("/auth/me/"),

                api.get("/classes/my-classes/"),

                api.get("/subjects/my-subjects/"),

                api.get("/students/"),

                api.get("/results/"),

                api.get("/teacher-assignments/my/"),

                api.get("/academic-years/current/"),
            ]);


            const teacherData =
                teacherResponse.data.teacher ||
                teacherResponse.data.user ||
                teacherResponse.data;


            setTeacher(teacherData);

            setClasses(
                getArrayData(
                    classesResponse.data
                )
            );

            setSubjects(
                getArrayData(
                    subjectsResponse.data
                )
            );

            setStudents(
                getArrayData(
                    studentsResponse.data
                )
            );

            setResults(
                getArrayData(
                    resultsResponse.data
                )
            );

            setAssignments(
                getArrayData(
                    assignmentsResponse.data
                )
            );

            setCurrentAcademicYear(
                academicYearResponse.data
            );

        } catch (error) {

            console.error(
                "Teacher dashboard error:",
                error
            );

            if (
                error.response?.status === 401
            ) {

                logout();

                return;
            }

            setError(
                error.response?.data?.detail ||
                "Could not load the teacher dashboard."
            );

        } finally {

            setLoading(false);
        }
    }


    /* --------------------------------
       RESULT FILTERING
    -------------------------------- */

    async function loadFilteredResults(
        filters = resultFilters
    ) {

        try {

            setResultLoading(true);

            const params = new URLSearchParams();


            if (filters.classroom) {

                params.append(
                    "classroom",
                    filters.classroom
                );
            }


            if (filters.subject) {

                params.append(
                    "subject",
                    filters.subject
                );
            }


            if (filters.semester) {

                params.append(
                    "semester",
                    filters.semester
                );
            }


            if (filters.exam_type) {

                params.append(
                    "exam_type",
                    filters.exam_type
                );
            }


            if (
                filters.search &&
                filters.search.trim()
            ) {

                params.append(
                    "search",
                    filters.search.trim()
                );
            }


            const query =
                params.toString();


            const response =
                await api.get(
                    query
                        ? `/results/?${query}`
                        : "/results/"
                );


            setResults(
                getArrayData(
                    response.data
                )
            );

        } catch (error) {

            console.error(
                "Result filter error:",
                error
            );

        } finally {

            setResultLoading(false);
        }
    }


    function handleResultFilterChange(event) {

        const {
            name,
            value,
        } = event.target;


        const newFilters = {
            ...resultFilters,
            [name]: value,
        };


        if (
            name === "classroom"
        ) {

            newFilters.subject = "";
        }


        setResultFilters(
            newFilters
        );

        loadFilteredResults(
            newFilters
        );
    }


    function clearResultFilters() {

        const clearedFilters = {
            classroom: "",
            subject: "",
            semester: "",
            exam_type: "",
            search: "",
        };


        setResultFilters(
            clearedFilters
        );

        loadFilteredResults(
            clearedFilters
        );
    }


    const filteredResultSubjects =
        useMemo(() => {

            if (
                !resultFilters.classroom
            ) {
                return [];
            }


            return assignments
                .filter(
                    assignment =>
                        Number(
                            assignment.classroom
                        ) === Number(
                            resultFilters.classroom
                        )
                )
                .filter(
                    assignment =>
                        !currentAcademicYear ||
                        Number(
                            assignment.academic_year
                        ) === Number(
                            currentAcademicYear.id
                        )
                )
                .filter(
                    (assignment, index, array) =>
                        array.findIndex(
                            item =>
                                Number(
                                    item.subject
                                ) === Number(
                                    assignment.subject
                                )
                        ) === index
                );

        }, [
            assignments,
            currentAcademicYear,
            resultFilters.classroom,
        ]);


    /* --------------------------------
       RESULT ACTIONS
    -------------------------------- */

    function openAddResult() {

        setEditingResult(null);
        setShowResultForm(true);
    }


    function openEditResult(result) {

        setEditingResult(result);
        setShowResultForm(true);
    }


    function closeResultForm() {

        setShowResultForm(false);
        setEditingResult(null);
    }


    function handleResultSaved() {

        closeResultForm();

        setRefresh(
            value => value + 1
        );
    }


    async function deleteResult(result) {

        const confirmed =
            window.confirm(
                `Delete the result for ${result.student_name} in ${result.subject_name}?`
            );


        if (!confirmed) {
            return;
        }


        try {

            await api.delete(
                `/results/${result.id}/`
            );


            setRefresh(
                value => value + 1
            );

        } catch (error) {

            console.error(
                "Delete result error:",
                error
            );

            alert(
                error.response?.data?.detail ||
                "Could not delete this result."
            );
        }
    }


    /* --------------------------------
       NAVIGATION
    -------------------------------- */

    function scrollToSection(id) {

        const element =
            document.getElementById(id);

        if (element) {

            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }


    /* --------------------------------
       LOADING
    -------------------------------- */

    if (loading) {

        return (
            <div className="teacher-loading-page">

                <div className="teacher-loading-card">

                    <div className="loading-logo">
                        SMS
                    </div>

                    <Loading
                        message="Preparing your teacher dashboard..."
                    />

                </div>

            </div>
        );
    }


    /* --------------------------------
       ERROR
    -------------------------------- */

    if (error) {

        return (

            <div className="teacher-error-page">

                <div className="teacher-error-card">

                    <div className="error-logo">
                        !
                    </div>

                    <h2>
                        Dashboard unavailable
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        className="teacher-primary-button"
                        onClick={() =>
                            setRefresh(
                                value => value + 1
                            )
                        }
                    >
                        Try Again
                    </button>

                    <button
                        className="teacher-secondary-button"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>

            </div>
        );
    }


    const firstName =
        user?.first_name ||
        teacher?.first_name ||
        "Teacher";


    const fullName =
        `${user?.first_name || ""} ${
            user?.last_name || ""
        }`.trim() ||
        teacher?.full_name ||
        "Teacher";


    const passedResults =
        results.filter(
            result =>
                result.status === "PASS"
        ).length;


    const failedResults =
        results.filter(
            result =>
                result.status === "FAIL"
        ).length;


    return (

        <div className="teacher-shell">

            {/* =================================
                SIDEBAR
            ================================= */}

            <aside className="teacher-sidebar">

                <div className="sidebar-brand">

                    <div className="brand-mark">
                        SMS
                    </div>

                    <div>
                        <strong>
                            Student
                        </strong>

                        <span>
                            Management System
                        </span>
                    </div>

                </div>


                <div className="sidebar-profile">

                    <div className="profile-avatar">
                        {getInitials(fullName)}
                    </div>

                    <div className="sidebar-profile-info">

                        <strong>
                            {fullName}
                        </strong>

                        <span>
                            Teacher
                        </span>

                    </div>

                </div>


                <nav className="sidebar-nav">

                    <p className="nav-label">
                        WORKSPACE
                    </p>

                    <button
                        className="nav-item active"
                        onClick={() =>
                            scrollToSection("overview")
                        }
                    >
                        <span className="nav-icon">
                            ◈
                        </span>

                        <span>
                            Overview
                        </span>
                    </button>


                    <button
                        className="nav-item"
                        onClick={() =>
                            scrollToSection("classes")
                        }
                    >
                        <span className="nav-icon">
                            ▦
                        </span>

                        <span>
                            My Classes
                        </span>
                    </button>


                    <button 
                            className="nav-item" 
                            onClick={() => 
                                navigate("/teacher/students")
                            } 
                        > 
                            <span className="nav-icon"> 
                                ◉ 
                            </span> 

                            <span> 
                                My Students 
                            </span> 
                        </button>
                    <button
                        className="nav-item"
                        onClick={() =>
                            scrollToSection("results")
                        }
                    >
                        <span className="nav-icon">
                            ◒
                        </span>

                        <span>
                            Results
                        </span>
                    </button>


                    <button
                        className="nav-item"
                        onClick={() =>
                            scrollToSection("subjects")
                        }
                    >
                        <span className="nav-icon">
                            ◫
                        </span>

                        <span>
                            Subjects
                        </span>
                    </button>


                    <p className="nav-label second">
                        ACCOUNT
                    </p>


                    <button
                        className="nav-item"
                        onClick={() =>
                            scrollToSection("profile")
                        }
                    >
                        <span className="nav-icon">
                            ◎
                        </span>

                        <span>
                            My Profile
                        </span>
                    </button>

                </nav>


                <div className="sidebar-bottom">

                    <div className="academic-year-mini">

                        <span className="year-dot"></span>

                        <div>
                            <small>
                                Academic Year
                            </small>

                            <strong>
                                {
                                    currentAcademicYear?.name ||
                                    "Not configured"
                                }
                            </strong>
                        </div>

                    </div>


                    <button
                        className="sidebar-logout"
                        onClick={logout}
                    >
                        <span>
                            ⇥
                        </span>

                        Logout
                    </button>

                </div>

            </aside>


            {/* =================================
                MAIN AREA
            ================================= */}

            <main className="teacher-main">

                {/* TOP BAR */}

                <header className="teacher-topbar">

                    <div className="mobile-brand">
                        <div className="brand-mark">
                            SMS
                        </div>
                    </div>


                    <div className="topbar-heading">

                        <span>
                            TEACHER PORTAL
                        </span>

                        <h1>
                            Dashboard
                        </h1>

                    </div>


                    <div className="topbar-actions">

                        <div className="year-pill">

                            <span className="year-dot"></span>

                            {
                                currentAcademicYear?.name ||
                                "Academic year"
                            }

                        </div>


                        <div className="topbar-user">

                            <div className="topbar-avatar">
                                {getInitials(fullName)}
                            </div>

                            <div>

                                <strong>
                                    {firstName}
                                </strong>

                                <span>
                                    Teacher
                                </span>

                            </div>

                        </div>

                    </div>

                </header>


                <div className="teacher-content">

                    {/* =================================
                        HERO
                    ================================= */}

                    <section
                        id="overview"
                        className="teacher-hero"
                    >

                        <div className="hero-content">

                            <div className="hero-eyebrow">
                                <span>
                                    ✦
                                </span>

                                TEACHER WORKSPACE
                            </div>

                            <h2>
                                Welcome back,
                                <br />

                                <span>
                                    {firstName}.
                                </span>
                            </h2>

                            <p>
                                Manage your classes, students,
                                subjects and academic results
                                from one place.
                            </p>


                            <div className="hero-actions">

                                <button
                                    className="hero-primary"
                                    onClick={openAddResult}
                                >
                                    <span>
                                        +
                                    </span>

                                    Enter Result
                                </button>


                                <button
                                    className="hero-secondary"
                                    onClick={() =>
                                        scrollToSection(
                                            "students"
                                        )
                                    }
                                >
                                    View Students
                                    <span>
                                        →
                                    </span>
                                </button>

                            </div>

                        </div>


                        <div className="hero-visual">

                            <div className="hero-orbit orbit-one"></div>
                            <div className="hero-orbit orbit-two"></div>
                            <div className="hero-orbit orbit-three"></div>

                            <div className="hero-center">

                                <div>
                                    {getInitials(fullName)}
                                </div>

                            </div>

                            <span className="floating-symbol symbol-one">
                                +
                            </span>

                            <span className="floating-symbol symbol-two">
                                %
                            </span>

                            <span className="floating-symbol symbol-three">
                                ✓
                            </span>

                        </div>

                    </section>


                    {/* =================================
                        STATISTICS
                    ================================= */}

                    <section className="stats-grid">

                        <StatCard
                            icon="▦"
                            label="My Classes"
                            value={classes.length}
                            accent="purple"
                        />

                        <StatCard
                            icon="◫"
                            label="My Subjects"
                            value={subjects.length}
                            accent="blue"
                        />

                        <StatCard
                            icon="◉"
                            label="Students"
                            value={students.length}
                            accent="green"
                        />

                        <StatCard
                            icon="◒"
                            label="Results Entered"
                            value={results.length}
                            accent="orange"
                        />

                    </section>


                    {/* =================================
                        OVERVIEW GRID
                    ================================= */}

                    <section className="overview-grid">

                        {/* PROFILE */}

                        <div
                            id="profile"
                            className="modern-card profile-card"
                        >

                            <CardHeading
                                eyebrow="ACCOUNT"
                                title="My Profile"
                                description="Your teacher information"
                                icon="◎"
                            />


                            <div className="profile-main">

                                <div className="large-avatar">
                                    {getInitials(fullName)}
                                </div>

                                <div>

                                    <h3>
                                        {fullName}
                                    </h3>

                                    <p>
                                        {teacher?.department ||
                                            "Teaching Department"}
                                    </p>

                                </div>

                            </div>


                            <div className="profile-information">

                                <ProfileRow
                                    label="Username"
                                    value={
                                        user?.username
                                    }
                                />

                                <ProfileRow
                                    label="Email"
                                    value={
                                        user?.email
                                    }
                                />

                                <ProfileRow
                                    label="Employee ID"
                                    value={
                                        teacher?.employee_id
                                    }
                                />

                                <ProfileRow
                                    label="Phone"
                                    value={
                                        teacher?.phone
                                    }
                                />

                            </div>

                        </div>


                        {/* CLASS SUMMARY */}

                        <div
                            id="classes"
                            className="modern-card"
                        >

                            <CardHeading
                                eyebrow="TEACHING LOAD"
                                title="My Classes"
                                description="Classes assigned to you"
                                icon="▦"
                            />


                            <div className="class-list-modern">

                                {classes.length === 0 ? (

                                    <EmptyState
                                        message="No classes assigned."
                                    />

                                ) : (

                                    classes.map(
                                        classroom => (

                                            <div
                                                className="class-row"
                                                key={
                                                    classroom.id
                                                }
                                            >

                                                <div className="class-number">
                                                    {classroom.grade}
                                                </div>

                                                <div className="class-info">

                                                    <strong>
                                                        {
                                                            classroom.name
                                                        }
                                                    </strong>

                                                    <span>
                                                        Grade{" "}
                                                        {
                                                            classroom.grade
                                                        }
                                                        {" • "}
                                                        Section{" "}
                                                        {
                                                            classroom.section
                                                        }
                                                    </span>

                                                </div>

                                                <span className="active-pill">
                                                    Active
                                                </span>

                                            </div>

                                        )
                                    )
                                )}

                            </div>

                        </div>


                        {/* SUBJECTS */}

                        <div
                            id="subjects"
                            className="modern-card"
                        >

                            <CardHeading
                                eyebrow="CURRICULUM"
                                title="My Subjects"
                                description="Subjects you teach"
                                icon="◫"
                            />


                            <div className="subject-list-modern">

                                {subjects.length === 0 ? (

                                    <EmptyState
                                        message="No subjects assigned."
                                    />

                                ) : (

                                    subjects.map(
                                        subject => (

                                            <div
                                                className="subject-row"
                                                key={
                                                    subject.id
                                                }
                                            >

                                                <div className="subject-symbol">
                                                    {
                                                        getSubjectInitial(
                                                            subject.name
                                                        )
                                                    }
                                                </div>

                                                <div>

                                                    <strong>
                                                        {
                                                            subject.name
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            subject.code
                                                        }
                                                    </span>

                                                </div>

                                                <span className="row-arrow">
                                                    →
                                                </span>

                                            </div>
                                        )
                                    )
                                )}

                            </div>

                        </div>


                        {/* RESULT SUMMARY */}

                        <div className="modern-card result-summary-card">

                            <CardHeading
                                eyebrow="PERFORMANCE"
                                title="Result Overview"
                                description="Your entered results"
                                icon="◒"
                            />


                            <div className="result-overview-number">

                                <strong>
                                    {results.length}
                                </strong>

                                <span>
                                    Total results
                                </span>

                            </div>


                            <div className="result-mini-grid">

                                <div>
                                    <strong>
                                        {passedResults}
                                    </strong>

                                    <span>
                                        Passed
                                    </span>
                                </div>


                                <div>
                                    <strong>
                                        {failedResults}
                                    </strong>

                                    <span>
                                        Failed
                                    </span>
                                </div>

                            </div>


                            <button
                                className="full-width-button"
                                onClick={() =>
                                    scrollToSection(
                                        "results"
                                    )
                                }
                            >
                                Manage Results
                                <span>
                                    →
                                </span>
                            </button>

                        </div>

                    </section>


                    {/* =================================
                        STUDENTS
                    ================================= */}

                    <section
                        id="students"
                        className="modern-card students-card"
                    >

                        <CardHeading
                            eyebrow="STUDENT DIRECTORY"
                            title="My Students"
                            description={
                                students.length
                                    ? `${students.length} students in your assigned classes`
                                    : "Students in your assigned classes"
                            }
                            icon="◉"
                            action={
                                <button
                                    className="small-outline-button"
                                    onClick={() =>
                                        scrollToSection(
                                            "results"
                                        )
                                    }
                                >
                                    Results →
                                </button>
                            }
                        />


                        {students.length === 0 ? (

                            <EmptyState
                                message="No students found."
                            />

                        ) : (

                            <div className="student-table-wrapper">

                                <table className="student-preview-table">

                                    <thead>

                                        <tr>
                                            <th>
                                                Student
                                            </th>

                                            <th>
                                                Student Code
                                            </th>

                                            <th>
                                                Gender
                                            </th>

                                            <th>
                                                Status
                                            </th>
                                        </tr>

                                    </thead>


                                    <tbody>

                                        {students
                                            .slice(0, 10)
                                            .map(
                                                student => (

                                                    <tr
                                                        key={
                                                            student.id
                                                        }
                                                    >

                                                        <td>

                                                            <div className="student-cell">

                                                                <div className="student-avatar">
                                                                    {
                                                                        getInitials(
                                                                            student.full_name ||
                                                                            `${student.first_name || ""} ${student.last_name || ""}`
                                                                        )
                                                                    }
                                                                </div>

                                                                <div>

                                                                    <strong>
                                                                        {
                                                                            student.full_name ||
                                                                            `${student.first_name || ""} ${student.last_name || ""}`
                                                                        }
                                                                    </strong>

                                                                    <span>
                                                                        Student
                                                                    </span>

                                                                </div>

                                                            </div>

                                                        </td>


                                                        <td>
                                                            <span className="code-badge">
                                                                {
                                                                    student.student_code
                                                                }
                                                            </span>
                                                        </td>


                                                        <td>
                                                            {
                                                                formatGender(
                                                                    student.gender
                                                                )
                                                            }
                                                        </td>


                                                        <td>
                                                            <span className="student-status">
                                                                Active
                                                            </span>
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                    </tbody>

                                </table>

                            </div>
                        )}

                    </section>


                    {/* =================================
                        RESULTS
                    ================================= */}

                    <section
                        id="results"
                        className="modern-card results-card"
                    >

                        <div className="results-heading">

                            <CardHeading
                                eyebrow="ACADEMIC RECORDS"
                                title="Results Management"
                                description="Enter, review and manage student results"
                                icon="◒"
                            />


                            <button
                                className="teacher-primary-button result-add-button"
                                onClick={openAddResult}
                            >
                                <span>
                                    +
                                </span>

                                Enter Result
                            </button>

                        </div>


                        {/* FILTERS */}

                        <div className="results-filter-panel">

                            <div className="filter-heading">

                                <div>

                                    <strong>
                                        Filter Results
                                    </strong>

                                    <span>
                                        Narrow down your records
                                    </span>

                                </div>

                                <button
                                    onClick={
                                        clearResultFilters
                                    }
                                >
                                    Clear all
                                </button>

                            </div>


                            <div className="filter-grid">

                                <FilterSelect
                                    label="Class"
                                    name="classroom"
                                    value={
                                        resultFilters.classroom
                                    }
                                    onChange={
                                        handleResultFilterChange
                                    }
                                >

                                    <option value="">
                                        All Classes
                                    </option>

                                    {classes.map(
                                        classroom => (

                                            <option
                                                key={
                                                    classroom.id
                                                }
                                                value={
                                                    classroom.id
                                                }
                                            >
                                                {
                                                    classroom.name
                                                }
                                            </option>
                                        )
                                    )}

                                </FilterSelect>


                                <FilterSelect
                                    label="Subject"
                                    name="subject"
                                    value={
                                        resultFilters.subject
                                    }
                                    onChange={
                                        handleResultFilterChange
                                    }
                                    disabled={
                                        !resultFilters.classroom
                                    }
                                >

                                    <option value="">
                                        {
                                            resultFilters.classroom
                                                ? "All Subjects"
                                                : "Select class first"
                                        }
                                    </option>

                                    {filteredResultSubjects.map(
                                        assignment => (

                                            <option
                                                key={
                                                    assignment.id
                                                }
                                                value={
                                                    assignment.subject
                                                }
                                            >
                                                {
                                                    assignment.subject_name
                                                }
                                            </option>
                                        )
                                    )}

                                </FilterSelect>


                                <FilterSelect
                                    label="Semester"
                                    name="semester"
                                    value={
                                        resultFilters.semester
                                    }
                                    onChange={
                                        handleResultFilterChange
                                    }
                                >

                                    <option value="">
                                        All Semesters
                                    </option>

                                    <option value="SEMESTER_1">
                                        Semester 1
                                    </option>

                                    <option value="SEMESTER_2">
                                        Semester 2
                                    </option>

                                </FilterSelect>


                                <FilterSelect
                                    label="Exam Type"
                                    name="exam_type"
                                    value={
                                        resultFilters.exam_type
                                    }
                                    onChange={
                                        handleResultFilterChange
                                    }
                                >

                                    <option value="">
                                        All Exam Types
                                    </option>

                                    <option value="QUIZ">
                                        Quiz
                                    </option>

                                    <option value="ASSIGNMENT">
                                        Assignment
                                    </option>

                                    <option value="MIDTERM">
                                        Midterm
                                    </option>

                                    <option value="FINAL">
                                        Final Exam
                                    </option>

                                    <option value="PROJECT">
                                        Project
                                    </option>

                                    <option value="PRACTICAL">
                                        Practical
                                    </option>

                                    <option value="OTHER">
                                        Other
                                    </option>

                                </FilterSelect>


                                <div className="filter-field search-field">

                                    <label>
                                        Search Student
                                    </label>

                                    <div className="search-input-wrapper">

                                        <span>
                                            ⌕
                                        </span>

                                        <input
                                            type="text"
                                            name="search"
                                            value={
                                                resultFilters.search
                                            }
                                            onChange={
                                                handleResultFilterChange
                                            }
                                            placeholder="Name or student code..."
                                        />

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* RESULT TABLE */}

                        <div className="results-table-wrapper">

                            {resultLoading ? (

                                <div className="table-loading">
                                    <div className="mini-spinner"></div>
                                    Loading results...
                                </div>

                            ) : results.length === 0 ? (

                                <EmptyState
                                    message="No results match your current filters."
                                />

                            ) : (

                                <table className="results-table-modern">

                                    <thead>

                                        <tr>

                                            <th>
                                                Student
                                            </th>

                                            <th>
                                                Subject
                                            </th>

                                            <th>
                                                Assessment
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

                                            <th>
                                                Actions
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {results.map(
                                            result => (

                                                <tr
                                                    key={
                                                        result.id
                                                    }
                                                >

                                                    <td>

                                                        <div className="result-student">

                                                            <div className="result-avatar">
                                                                {
                                                                    getInitials(
                                                                        result.student_name
                                                                    )
                                                                }
                                                            </div>

                                                            <div>

                                                                <strong>
                                                                    {
                                                                        result.student_name
                                                                    }
                                                                </strong>

                                                                <span>
                                                                    {
                                                                        result.student_code
                                                                    }
                                                                </span>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    <td>

                                                        <span className="subject-table-name">
                                                            {
                                                                result.subject_name
                                                            }
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <span className="assessment-badge">
                                                            {
                                                                formatExamType(
                                                                    result.exam_type
                                                                )
                                                            }
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <strong className="score-value">
                                                            {
                                                                result.score
                                                            }
                                                        </strong>

                                                        <span className="score-max">
                                                            {" / "}
                                                            {
                                                                result.max_score
                                                            }
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <div className="percentage-cell">

                                                            <strong>
                                                                {
                                                                    result.percentage
                                                                }%
                                                            </strong>

                                                            <div className="percentage-bar">

                                                                <span
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            Number(
                                                                                result.percentage
                                                                            ) || 0,
                                                                            100
                                                                        )}%`,
                                                                    }}
                                                                ></span>

                                                            </div>

                                                        </div>

                                                    </td>


                                                    <td>

                                                        <span
                                                            className={
                                                                result.status === "PASS"
                                                                    ? "result-status pass"
                                                                    : "result-status fail"
                                                            }
                                                        >
                                                            <span></span>

                                                            {
                                                                result.status
                                                            }
                                                        </span>

                                                    </td>


                                                    <td>

                                                        <div className="table-actions">

                                                            <button
                                                                className="table-edit-button"
                                                                onClick={() =>
                                                                    openEditResult(
                                                                        result
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>


                                                            <button
                                                                className="table-delete-button"
                                                                onClick={() =>
                                                                    deleteResult(
                                                                        result
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>
                            )}

                        </div>

                    </section>

                </div>

            </main>


            {/* =================================
                RESULT MODAL
            ================================= */}

            {showResultForm && (

                <ResultForm
                    students={students}
                    subjects={subjects}
                    classes={classes}
                    assignments={assignments}
                    currentAcademicYear={
                        currentAcademicYear
                    }
                    editingResult={
                        editingResult
                    }
                    onClose={
                        closeResultForm
                    }
                    onSaved={
                        handleResultSaved
                    }
                />
            )}

        </div>
    );
}


/* =================================
   RESULT FORM
================================= */

function ResultForm({
    students,
    subjects,
    classes,
    assignments,
    currentAcademicYear,
    editingResult,
    onClose,
    onSaved,
}) {

    const isEditing =
        !!editingResult;


    const [classStudents, setClassStudents] =
        useState([]);

    const [loadingStudents, setLoadingStudents] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");


    const [form, setForm] = useState({

        student:
            editingResult?.student || "",

        subject:
            editingResult?.subject || "",

        classroom:
            editingResult?.classroom || "",

        academic_year:
            editingResult?.academic_year ||
            currentAcademicYear?.id ||
            "",

        semester:
            editingResult?.semester ||
            "SEMESTER_1",

        exam_type:
            editingResult?.exam_type ||
            "QUIZ",

        title:
            editingResult?.title ||
            "",

        score:
            editingResult?.score ||
            "",

        max_score:
            editingResult?.max_score ||
            "",

        comment:
            editingResult?.comment ||
            "",
    });


    useEffect(() => {

        if (
            editingResult?.classroom
        ) {

            loadStudentsForClass(
                editingResult.classroom
            );

        }

    }, [editingResult]);


    async function loadStudentsForClass(
        classroomId
    ) {

        if (!classroomId) {

            setClassStudents([]);

            return;
        }


        setLoadingStudents(true);
        setError("");


        try {

            const response =
                await api.get(
                    `/students/teacher-class/${classroomId}/students/`
                );


            setClassStudents(
                getArrayData(
                    response.data
                )
            );

        } catch (error) {

            console.error(
                "Student loading error:",
                error
            );

            setClassStudents([]);

            setError(
                error.response?.data?.detail ||
                "Could not load students."
            );

        } finally {

            setLoadingStudents(false);
        }
    }


    async function handleClassChange(
        event
    ) {

        const classroomId =
            event.target.value;


        setForm(
            previous => ({
                ...previous,
                classroom:
                    classroomId,
                student: "",
                subject: "",
            })
        );


        await loadStudentsForClass(
            classroomId
        );
    }


    function handleChange(event) {

        const {
            name,
            value,
        } = event.target;


        setForm(
            previous => ({
                ...previous,
                [name]: value,
            })
        );
    }


    const availableSubjects =
        assignments
            .filter(
                assignment =>
                    Number(
                        assignment.classroom
                    ) === Number(
                        form.classroom
                    )
            )
            .filter(
                assignment =>
                    !currentAcademicYear ||
                    Number(
                        assignment.academic_year
                    ) === Number(
                        currentAcademicYear.id
                    )
            )
            .filter(
                (assignment, index, array) =>
                    array.findIndex(
                        item =>
                            Number(
                                item.subject
                            ) === Number(
                                assignment.subject
                            )
                    ) === index
            );


    async function handleSubmit(event) {

        event.preventDefault();

        setError("");


        if (!form.classroom) {

            setError(
                "Please select a class."
            );

            return;
        }


        if (!form.student) {

            setError(
                "Please select a student."
            );

            return;
        }


        if (!form.subject) {

            setError(
                "Please select a subject."
            );

            return;
        }


        if (!form.academic_year) {

            setError(
                "No academic year is selected."
            );

            return;
        }


        if (
            Number(form.score) >
            Number(form.max_score)
        ) {

            setError(
                "Score cannot be greater than maximum score."
            );

            return;
        }


        setSaving(true);


        try {

            const payload = {

                ...form,

                academic_year:
                    Number(
                        form.academic_year
                    ),

                classroom:
                    Number(
                        form.classroom
                    ),

                student:
                    Number(
                        form.student
                    ),

                subject:
                    Number(
                        form.subject
                    ),
            };


            if (isEditing) {

                await api.put(
                    `/results/${editingResult.id}/`,
                    payload
                );

            } else {

                await api.post(
                    "/results/",
                    payload
                );
            }


            onSaved();

        } catch (error) {

            console.error(
                "Save result error:",
                error
            );


            const responseData =
                error.response?.data;


            if (
                responseData?.detail
            ) {

                setError(
                    responseData.detail
                );

            } else if (
                responseData &&
                typeof responseData === "object"
            ) {

                const messages =
                    Object.entries(
                        responseData
                    )
                    .map(
                        ([field, value]) => {

                            const message =
                                Array.isArray(value)
                                    ? value.join(", ")
                                    : value;

                            return `${field}: ${message}`;
                        }
                    )
                    .join(" | ");


                setError(
                    messages ||
                    "Could not save result."
                );

            } else {

                setError(
                    "Could not save result."
                );
            }

        } finally {

            setSaving(false);
        }
    }


    return (

        <div
            className="result-modal-overlay"
            onMouseDown={event => {

                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }

            }}
        >

            <div className="result-modal">

                <div className="modal-top">

                    <div>

                        <span className="modal-eyebrow">
                            ACADEMIC RECORD
                        </span>

                        <h2>
                            {
                                isEditing
                                    ? "Edit Result"
                                    : "Enter Result"
                            }
                        </h2>

                        <p>
                            Record an academic assessment
                            for a student.
                        </p>

                    </div>


                    <button
                        className="modal-close"
                        onClick={onClose}
                        type="button"
                    >
                        ×
                    </button>

                </div>


                {error && (

                    <div className="modal-error">
                        <span>
                            !
                        </span>

                        {error}
                    </div>
                )}


                <form
                    onSubmit={handleSubmit}
                >

                    <div className="modal-section-title">
                        Student & Class
                    </div>


                    <div className="modal-form-grid">

                        <FormField label="Class">

                            <select
                                name="classroom"
                                value={
                                    form.classroom
                                }
                                onChange={
                                    handleClassChange
                                }
                                required
                            >

                                <option value="">
                                    Select class
                                </option>

                                {classes.map(
                                    classroom => (

                                        <option
                                            key={
                                                classroom.id
                                            }
                                            value={
                                                classroom.id
                                            }
                                        >
                                            {
                                                classroom.name
                                            }
                                        </option>
                                    )
                                )}

                            </select>

                        </FormField>


                        <FormField label="Student">

                            <select
                                name="student"
                                value={
                                    form.student
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                disabled={
                                    !form.classroom ||
                                    loadingStudents
                                }
                            >

                                <option value="">
                                    {
                                        loadingStudents
                                            ? "Loading students..."
                                            : !form.classroom
                                                ? "Select class first"
                                                : "Select student"
                                    }
                                </option>

                                {classStudents.map(
                                    student => (

                                        <option
                                            key={
                                                student.id
                                            }
                                            value={
                                                student.id
                                            }
                                        >
                                            {
                                                student.full_name
                                            }
                                            {" — "}
                                            {
                                                student.student_code
                                            }
                                        </option>
                                    )
                                )}

                            </select>

                        </FormField>


                        <FormField label="Subject">

                            <select
                                name="subject"
                                value={
                                    form.subject
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                disabled={
                                    !form.classroom
                                }
                            >

                                <option value="">
                                    {
                                        !form.classroom
                                            ? "Select class first"
                                            : "Select subject"
                                    }
                                </option>

                                {availableSubjects.map(
                                    assignment => (

                                        <option
                                            key={
                                                assignment.id
                                            }
                                            value={
                                                assignment.subject
                                            }
                                        >
                                            {
                                                assignment.subject_name
                                            }
                                            {" ("}
                                            {
                                                assignment.subject_code
                                            }
                                            {")"}
                                        </option>
                                    )
                                )}

                            </select>

                        </FormField>


                        <FormField label="Academic Year">

                            <input
                                value={
                                    currentAcademicYear?.name ||
                                    "Not configured"
                                }
                                readOnly
                            />

                        </FormField>

                    </div>


                    <div className="modal-section-title">
                        Assessment
                    </div>


                    <div className="modal-form-grid">

                        <FormField label="Semester">

                            <select
                                name="semester"
                                value={
                                    form.semester
                                }
                                onChange={
                                    handleChange
                                }
                            >

                                <option value="SEMESTER_1">
                                    Semester 1
                                </option>

                                <option value="SEMESTER_2">
                                    Semester 2
                                </option>

                            </select>

                        </FormField>


                        <FormField label="Exam Type">

                            <select
                                name="exam_type"
                                value={
                                    form.exam_type
                                }
                                onChange={
                                    handleChange
                                }
                            >

                                <option value="QUIZ">
                                    Quiz
                                </option>

                                <option value="ASSIGNMENT">
                                    Assignment
                                </option>

                                <option value="MIDTERM">
                                    Midterm
                                </option>

                                <option value="FINAL">
                                    Final Exam
                                </option>

                                <option value="PROJECT">
                                    Project
                                </option>

                                <option value="PRACTICAL">
                                    Practical
                                </option>

                                <option value="OTHER">
                                    Other
                                </option>

                            </select>

                        </FormField>


                        <FormField label="Assessment Title">

                            <input
                                type="text"
                                name="title"
                                value={
                                    form.title
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="e.g. HTML Quiz 1"
                            />

                        </FormField>


                        <FormField label="Score">

                            <input
                                type="number"
                                name="score"
                                value={
                                    form.score
                                }
                                onChange={
                                    handleChange
                                }
                                min="0"
                                step="0.01"
                                required
                                placeholder="0"
                            />

                        </FormField>


                        <FormField label="Maximum Score">

                            <input
                                type="number"
                                name="max_score"
                                value={
                                    form.max_score
                                }
                                onChange={
                                    handleChange
                                }
                                min="0.01"
                                step="0.01"
                                required
                                placeholder="100"
                            />

                        </FormField>

                    </div>


                    <FormField label="Comment">

                        <textarea
                            name="comment"
                            value={
                                form.comment
                            }
                            onChange={
                                handleChange
                            }
                            rows="4"
                            placeholder="Optional comment..."
                        />

                    </FormField>


                    <div className="modal-actions">

                        <button
                            type="button"
                            className="modal-cancel"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="modal-save"
                            disabled={
                                saving ||
                                loadingStudents
                            }
                        >
                            {
                                saving
                                    ? "Saving..."
                                    : isEditing
                                        ? "Update Result"
                                        : "Save Result"
                            }
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}


/* =================================
   SMALL COMPONENTS
================================= */

function StatCard({
    icon,
    label,
    value,
    accent,
}) {

    return (

        <div
            className={`stat-card-modern ${accent}`}
        >

            <div className="stat-card-icon">
                {icon}
            </div>

            <div className="stat-card-text">

                <span>
                    {label}
                </span>

                <strong>
                    {value}
                </strong>

            </div>

            <div className="stat-card-arrow">
                ↗
            </div>

        </div>
    );
}


function CardHeading({
    eyebrow,
    title,
    description,
    icon,
    action,
}) {

    return (

        <div className="card-heading">

            <div className="card-heading-icon">
                {icon}
            </div>

            <div className="card-heading-text">

                <span>
                    {eyebrow}
                </span>

                <h3>
                    {title}
                </h3>

                <p>
                    {description}
                </p>

            </div>

            {action && (
                <div className="card-heading-action">
                    {action}
                </div>
            )}

        </div>
    );
}


function ProfileRow({
    label,
    value,
}) {

    return (

        <div className="profile-info-row">

            <span>
                {label}
            </span>

            <strong>
                {value || "Not provided"}
            </strong>

        </div>
    );
}


function FilterSelect({
    label,
    name,
    value,
    onChange,
    disabled = false,
    children,
}) {

    return (

        <div className="filter-field">

            <label>
                {label}
            </label>

            <select
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
            >
                {children}
            </select>

        </div>
    );
}


function FormField({
    label,
    children,
}) {

    return (

        <div className="modal-form-field">

            <label>
                {label}
            </label>

            {children}

        </div>
    );
}


function EmptyState({
    message,
}) {

    return (

        <div className="modern-empty">

            <div>
                ∅
            </div>

            <strong>
                Nothing here yet
            </strong>

            <p>
                {message}
            </p>

        </div>
    );
}


/* =================================
   HELPERS
================================= */

function getArrayData(data) {

    if (Array.isArray(data)) {
        return data;
    }


    if (
        Array.isArray(
            data?.results
        )
    ) {
        return data.results;
    }


    return [];
}


function getInitials(name) {

    if (!name) {
        return "T";
    }


    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(
            word =>
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
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );
}


function formatGender(gender) {

    if (!gender) {
        return "—";
    }


    const values = {
        M: "Male",
        F: "Female",
        O: "Other",
    };


    return (
        values[gender] ||
        gender
    );
}


export default TeacherDashboard;