import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../api/axios";

import { useAuth } from "../context/AuthContext";

import "./EnrollmentManagement.css";


function getArrayData(data) {

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
}


function getInitials(name) {

    if (!name) {
        return "?";
    }

    const parts = name
        .trim()
        .split(" ")
        .filter(Boolean);

    if (parts.length === 1) {
        return parts[0][0].toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


function formatDate(date) {

    if (!date) {
        return "N/A";
    }

    return new Date(date).toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
}


function StudentAvatar({ student }) {

    if (student?.photo) {

        return (
            <img
                src={student.photo}
                alt={student.full_name}
                className="enrollment-avatar"
            />
        );
    }

    return (
        <div className="enrollment-avatar avatar-placeholder">
            {getInitials(
                student?.full_name
            )}
        </div>
    );
}


export default function EnrollmentManagement() {

    const navigate =
        useNavigate();

    const { user } =
        useAuth();


    const [students, setStudents] =
        useState([]);

    const [classes, setClasses] =
        useState([]);

    const [academicYear, setAcademicYear] =
        useState(null);

    const [enrollments, setEnrollments] =
        useState([]);


    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);


    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    const [search, setSearch] =
        useState("");

    const [classFilter, setClassFilter] =
        useState("ALL");

    const [statusFilter, setStatusFilter] =
        useState("ALL");


    const [showModal, setShowModal] =
        useState(false);


    const [selectedStudent, setSelectedStudent] =
        useState("");

    const [selectedClass, setSelectedClass] =
        useState("");


    useEffect(() => {

        loadPageData();

    }, []);


    async function loadPageData() {

        setLoading(true);
        setError("");

        try {

            const [
                studentsResponse,
                classesResponse,
                yearResponse,
                enrollmentsResponse,
            ] = await Promise.all([

                api.get(
                    "/students/"
                ),

                api.get(
                    "/classes/"
                ),

                api.get(
                    "/academic-years/current/"
                ),

                api.get(
                    "/enrollment-management/"
                ),

            ]);


            setStudents(
                getArrayData(
                    studentsResponse.data
                )
            );


            setClasses(
                getArrayData(
                    classesResponse.data
                )
            );


            setAcademicYear(
                yearResponse.data
            );


            setEnrollments(
                getArrayData(
                    enrollmentsResponse.data
                )
            );


        } catch (error) {

            console.error(
                "Could not load enrollment data:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Could not load enrollment management data."
            );

        } finally {

            setLoading(false);
        }
    }


    const filteredEnrollments =
        useMemo(() => {

            const query =
                search
                    .trim()
                    .toLowerCase();

            return enrollments.filter(
                (enrollment) => {

                    const name =
                        enrollment.student
                            ?.full_name ||
                        "";

                    const code =
                        enrollment.student
                            ?.student_code ||
                        "";

                    const classroom =
                        enrollment.classroom
                            ?.name ||
                        "";

                    const matchesSearch =
                        !query ||
                        name
                            .toLowerCase()
                            .includes(query) ||
                        code
                            .toLowerCase()
                            .includes(query) ||
                        classroom
                            .toLowerCase()
                            .includes(query);


                    const matchesClass =
                        classFilter === "ALL" ||
                        String(
                            enrollment.classroom?.id
                        ) ===
                        String(classFilter);


                    const matchesStatus =
                        statusFilter === "ALL" ||
                        (
                            statusFilter === "ACTIVE" &&
                            enrollment.is_active
                        ) ||
                        (
                            statusFilter === "INACTIVE" &&
                            !enrollment.is_active
                        );


                    return (
                        matchesSearch &&
                        matchesClass &&
                        matchesStatus
                    );
                }
            );

        }, [
            enrollments,
            search,
            classFilter,
            statusFilter,
        ]);


    const activeCount =
        enrollments.filter(
            (item) =>
                item.is_active
        ).length;


    const inactiveCount =
        enrollments.filter(
            (item) =>
                !item.is_active
        ).length;


    const grade11Count =
        enrollments.filter(
            (item) =>
                Number(
                    item.classroom?.grade
                ) === 11 &&
                item.is_active
        ).length;


    function openEnrollmentModal() {

        setSelectedStudent("");
        setSelectedClass("");

        setError("");
        setSuccess("");

        setShowModal(true);
    }


    function closeEnrollmentModal() {

        if (saving) {
            return;
        }

        setShowModal(false);
    }


    async function handleEnrollStudent(
        event
    ) {

        event.preventDefault();

        setError("");
        setSuccess("");


        if (!selectedStudent) {

            setError(
                "Please select a student."
            );

            return;
        }


        if (!selectedClass) {

            setError(
                "Please select a class."
            );

            return;
        }


        if (!academicYear?.id) {

            setError(
                "No current academic year is configured."
            );

            return;
        }


        setSaving(true);


        try {

            const response =
                await api.post(
                    "/enrollment-management/",
                    {
                        student:
                            Number(
                                selectedStudent
                            ),

                        classroom:
                            Number(
                                selectedClass
                            ),

                        academic_year:
                            academicYear.id,
                    }
                );


            setSuccess(
                response.data.message ||
                "Student enrolled successfully."
            );


            setShowModal(false);


            await loadPageData();


        } catch (error) {

            console.error(
                "Could not enroll student:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Could not enroll the student."
            );

        } finally {

            setSaving(false);
        }
    }


    async function toggleEnrollment(
        enrollment
    ) {

        setError("");
        setSuccess("");


        try {

            const response =
                await api.patch(
                    `/enrollment-management/${enrollment.id}/`,
                    {
                        is_active:
                            !enrollment.is_active,
                    }
                );


            setSuccess(
                response.data.message ||
                "Enrollment updated successfully."
            );


            setEnrollments(
                (previous) =>
                    previous.map(
                        (item) =>
                            item.id ===
                            enrollment.id
                                ? {
                                    ...item,
                                    is_active:
                                        !item.is_active,
                                }
                                : item
                    )
            );


        } catch (error) {

            console.error(
                "Could not update enrollment:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Could not update enrollment."
            );
        }
    }


    async function changeClass(
        enrollment,
        classroomId
    ) {

        if (!classroomId) {
            return;
        }


        setError("");
        setSuccess("");


        try {

            const response =
                await api.patch(
                    `/enrollment-management/${enrollment.id}/`,
                    {
                        classroom:
                            Number(
                                classroomId
                            ),
                    }
                );


            setSuccess(
                response.data.message ||
                "Student class updated successfully."
            );


            const selectedClassObject =
                classes.find(
                    (item) =>
                        String(item.id) ===
                        String(classroomId)
                );


            setEnrollments(
                (previous) =>
                    previous.map(
                        (item) =>
                            item.id ===
                            enrollment.id
                                ? {
                                    ...item,

                                    classroom: {
                                        id:
                                            selectedClassObject.id,

                                        name:
                                            selectedClassObject.name,

                                        grade:
                                            selectedClassObject.grade,

                                        section:
                                            selectedClassObject.section,
                                    },
                                }
                                : item
                    )
            );


        } catch (error) {

            console.error(
                "Could not change class:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Could not change the student's class."
            );
        }
    }


    if (loading) {

        return (
            <div className="enrollment-page">

                <div className="enrollment-loading">

                    <div className="enrollment-spinner">
                        ⟳
                    </div>

                    <h3>
                        Loading enrollment management...
                    </h3>

                </div>

            </div>
        );
    }


    return (
        <div className="enrollment-page">

            <header className="enrollment-header">

                <div>

                    <button
                        type="button"
                        className="enrollment-back-button"
                        onClick={() =>
                            navigate(
                                "/admin/dashboard"
                            )
                        }
                    >
                        ← Dashboard
                    </button>

                    <span className="enrollment-eyebrow">
                        ADMINISTRATION
                    </span>

                    <h1>
                        Student Enrollment
                    </h1>

                    <p>
                        Manage student class placement
                        and enrollment status.
                    </p>

                </div>


                <div className="enrollment-user">

                    <div className="enrollment-user-avatar">
                        {getInitials(
                            user?.full_name ||
                            user?.username
                        )}
                    </div>

                    <div>

                        <strong>
                            {user?.full_name ||
                                user?.username ||
                                "Administrator"}
                        </strong>

                        <span>
                            Administrator
                        </span>

                    </div>

                </div>

            </header>


            <main className="enrollment-content">

                {error && (

                    <div className="enrollment-alert error">

                        <strong>
                            Error
                        </strong>

                        <span>
                            {error}
                        </span>

                    </div>

                )}


                {success && (

                    <div className="enrollment-alert success">

                        <strong>
                            Success
                        </strong>

                        <span>
                            {success}
                        </span>

                    </div>

                )}


                <section className="enrollment-top-card">

                    <div>

                        <span className="enrollment-label">
                            CURRENT ACADEMIC YEAR
                        </span>

                        <h2>
                            {academicYear?.name ||
                                "Not configured"}
                        </h2>

                        <p>
                            Students enrolled for this
                            academic year.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="add-enrollment-button"
                        onClick={
                            openEnrollmentModal
                        }
                    >
                        + Enroll Student
                    </button>

                </section>


                <section className="enrollment-stats">

                    <div className="enrollment-stat">

                        <span>
                            Total Enrollments
                        </span>

                        <strong>
                            {enrollments.length}
                        </strong>

                    </div>


                    <div className="enrollment-stat">

                        <span>
                            Active
                        </span>

                        <strong>
                            {activeCount}
                        </strong>

                    </div>


                    <div className="enrollment-stat">

                        <span>
                            Inactive
                        </span>

                        <strong>
                            {inactiveCount}
                        </strong>

                    </div>


                    <div className="enrollment-stat">

                        <span>
                            Grade 11
                        </span>

                        <strong>
                            {grade11Count}
                        </strong>

                    </div>

                </section>


                <section className="enrollment-list-card">

                    <div className="enrollment-list-header">

                        <div>

                            <span>
                                ENROLLMENT DIRECTORY
                            </span>

                            <h2>
                                Student Enrollments
                            </h2>

                        </div>

                        <strong>
                            {filteredEnrollments.length}
                            {" "}
                            records
                        </strong>

                    </div>


                    <div className="enrollment-filters">

                        <div className="enrollment-search">

                            <span>
                                ⌕
                            </span>

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search student..."
                            />

                        </div>


                        <select
                            value={classFilter}
                            onChange={(event) =>
                                setClassFilter(
                                    event.target.value
                                )
                            }
                        >

                            <option value="ALL">
                                All Classes
                            </option>

                            {classes.map(
                                (classroom) => (

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


                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                        >

                            <option value="ALL">
                                All Status
                            </option>

                            <option value="ACTIVE">
                                Active
                            </option>

                            <option value="INACTIVE">
                                Inactive
                            </option>

                        </select>

                    </div>


                    <div className="enrollment-table-wrapper">

                        <table className="enrollment-table">

                            <thead>

                                <tr>

                                    <th>
                                        Student
                                    </th>

                                    <th>
                                        Code
                                    </th>

                                    <th>
                                        Class
                                    </th>

                                    <th>
                                        Academic Year
                                    </th>

                                    <th>
                                        Enrolled
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

                                {filteredEnrollments.length ===
                                0 ? (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            className="no-enrollments"
                                        >
                                            No enrollments found.
                                        </td>

                                    </tr>

                                ) : (

                                    filteredEnrollments.map(
                                        (enrollment) => (

                                            <tr
                                                key={
                                                    enrollment.id
                                                }
                                            >

                                                <td>

                                                    <div className="enrollment-student">

                                                        <StudentAvatar
                                                            student={
                                                                enrollment.student
                                                            }
                                                        />

                                                        <div>

                                                            <strong>
                                                                {
                                                                    enrollment
                                                                        .student
                                                                        ?.full_name
                                                                }
                                                            </strong>

                                                            <span>
                                                                @
                                                                {
                                                                    enrollment
                                                                        .student
                                                                        ?.username
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>


                                                <td>

                                                    <span className="enrollment-code">
                                                        {
                                                            enrollment
                                                                .student
                                                                ?.student_code
                                                        }
                                                    </span>

                                                </td>


                                                <td>

                                                    <select
                                                        className="class-change-select"
                                                        value={
                                                            enrollment
                                                                .classroom
                                                                ?.id
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            changeClass(
                                                                enrollment,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        disabled={
                                                            !enrollment.is_active
                                                        }
                                                    >

                                                        {classes.map(
                                                            (
                                                                classroom
                                                            ) => (

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

                                                </td>


                                                <td>

                                                    {
                                                        enrollment
                                                            .academic_year
                                                            ?.name
                                                    }

                                                </td>


                                                <td>

                                                    {
                                                        formatDate(
                                                            enrollment.enrollment_date
                                                        )
                                                    }

                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            enrollment.is_active
                                                                ? "enrollment-status active"
                                                                : "enrollment-status inactive"
                                                        }
                                                    >
                                                        {enrollment.is_active
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>

                                                </td>


                                                <td>

                                                    <button
                                                        type="button"
                                                        className={
                                                            enrollment.is_active
                                                                ? "enrollment-action deactivate"
                                                                : "enrollment-action activate"
                                                        }
                                                        onClick={() =>
                                                            toggleEnrollment(
                                                                enrollment
                                                            )
                                                        }
                                                    >
                                                        {enrollment.is_active
                                                            ? "Deactivate"
                                                            : "Activate"}
                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

            </main>


            {showModal && (

                <div className="enrollment-modal-overlay">

                    <div className="enrollment-modal">

                        <div className="enrollment-modal-header">

                            <div>

                                <span>
                                    NEW ENROLLMENT
                                </span>

                                <h2>
                                    Enroll Student
                                </h2>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    closeEnrollmentModal
                                }
                            >
                                ×
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleEnrollStudent
                            }
                        >

                            <div className="enrollment-form-group">

                                <label>
                                    Student
                                </label>

                                <select
                                    value={
                                        selectedStudent
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSelectedStudent(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                >

                                    <option value="">
                                        Select a student
                                    </option>

                                    {students.map(
                                        (student) => (

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

                            </div>


                            <div className="enrollment-form-group">

                                <label>
                                    Class
                                </label>

                                <select
                                    value={
                                        selectedClass
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSelectedClass(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                >

                                    <option value="">
                                        Select a class
                                    </option>

                                    {classes.map(
                                        (classroom) => (

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

                            </div>


                            <div className="enrollment-form-group">

                                <label>
                                    Academic Year
                                </label>

                                <input
                                    type="text"
                                    value={
                                        academicYear?.name ||
                                        ""
                                    }
                                    disabled
                                />

                            </div>


                            <div className="enrollment-modal-actions">

                                <button
                                    type="button"
                                    className="enrollment-cancel"
                                    onClick={
                                        closeEnrollmentModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="enrollment-submit"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving
                                        ? "Enrolling..."
                                        : "Enroll Student"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}