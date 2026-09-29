import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../api/axios";

import { useAuth } from "../context/AuthContext";

import "./StudentManagement.css";


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


function getGenderLabel(gender) {

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


function formatDate(date) {

    if (!date) {
        return "Not provided";
    }

    try {

        return new Date(date).toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
            }
        );

    } catch {

        return date;
    }
}


function formatExamType(type) {

    if (!type) {
        return "Assessment";
    }

    return type
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}


function StudentAvatar({
    student,
    large = false,
}) {

    if (student?.photo) {

        return (
            <img
                src={student.photo}
                alt={student.full_name}
                className={
                    large
                        ? "student-avatar large"
                        : "student-avatar"
                }
            />
        );
    }

    return (
        <div
            className={
                large
                    ? "student-avatar large avatar-placeholder"
                    : "student-avatar avatar-placeholder"
            }
        >
            {getInitials(
                student?.full_name
            )}
        </div>
    );
}


function StatCard({
    label,
    value,
    icon,
}) {

    return (
        <div className="student-stat-card">

            <div className="student-stat-icon">
                {icon}
            </div>

            <div className="student-stat-content">

                <span>
                    {label}
                </span>

                <strong>
                    {value}
                </strong>

            </div>

        </div>
    );
}


function EmptyStudents() {

    return (
        <div className="student-empty-state">

            <div className="student-empty-icon">
                🎓
            </div>

            <h3>
                No students found
            </h3>

            <p>
                There are no students matching
                your current selection or search.
            </p>

        </div>
    );
}


function StudentProfilePanel({
    student,
    results,
    loading,
    error,
    onClose,
    onUpdated,
}) {

    const [editing, setEditing] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [saveError, setSaveError] =
        useState("");

    const [saveSuccess, setSaveSuccess] =
        useState("");

    const [form, setForm] = useState({
        phone: "",
        address: "",
        guardian_name: "",
        guardian_phone: "",
        photo: null,
    });


    useEffect(() => {

        if (!student) {
            return;
        }

        setForm({
            phone: student.phone || "",
            address: student.address || "",
            guardian_name:
                student.guardian_name || "",
            guardian_phone:
                student.guardian_phone || "",
            photo: null,
        });

        setEditing(false);
        setSaveError("");
        setSaveSuccess("");

    }, [student]);


    function handleFormChange(event) {

        const {
            name,
            value,
            files,
        } = event.target;

        if (name === "photo") {

            setForm((previous) => ({
                ...previous,
                photo:
                    files?.[0] || null,
            }));

            return;
        }

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }


    async function handleSaveStudent() {

        if (!student) {
            return;
        }

        setSaving(true);
        setSaveError("");
        setSaveSuccess("");

        try {

            const formData =
                new FormData();

            formData.append(
                "phone",
                form.phone
            );

            formData.append(
                "address",
                form.address
            );

            formData.append(
                "guardian_name",
                form.guardian_name
            );

            formData.append(
                "guardian_phone",
                form.guardian_phone
            );

            if (form.photo) {

                formData.append(
                    "photo",
                    form.photo
                );
            }

            const response =
                await api.patch(
                    `/students/teacher/${student.id}/update/`,
                    formData
                );

            setSaveSuccess(
                response.data.message ||
                "Student profile updated successfully."
            );

            setEditing(false);

            if (
                typeof onUpdated ===
                "function"
            ) {

                onUpdated(
                    response.data.student
                );
            }

        } catch (error) {

            console.error(
                "Could not update student:",
                error
            );

            setSaveError(
                error.response?.data?.detail ||
                "Could not update the student profile."
            );

        } finally {

            setSaving(false);
        }
    }


    if (!student) {
        return null;
    }


    return (
        <div className="student-profile-overlay">

            <div className="student-profile-panel">

                <div className="student-profile-header">

                    <div className="profile-heading">

                        <StudentAvatar
                            student={student}
                            large
                        />

                        <div>

                            <span className="profile-eyebrow">
                                STUDENT PROFILE
                            </span>

                            <h2>
                                {student.full_name}
                            </h2>

                            <p>
                                {student.student_code}
                            </p>

                        </div>

                    </div>


                    <div className="profile-actions">

                        {!editing && (
                            <button
                                type="button"
                                className="profile-edit-button"
                                onClick={() => {
                                    setEditing(true);
                                    setSaveError("");
                                    setSaveSuccess("");
                                }}
                            >
                                ✎ Edit Student
                            </button>
                        )}

                        <button
                            type="button"
                            className="profile-close-button"
                            onClick={onClose}
                        >
                            ×
                        </button>

                    </div>

                </div>


                <div className="student-profile-body">

                    {saveSuccess && (
                        <div className="student-success-message">
                            ✓ {saveSuccess}
                        </div>
                    )}


                    {saveError && (
                        <div className="student-error-message">
                            {saveError}
                        </div>
                    )}


                    {loading ? (

                        <div className="profile-loading-box">
                            Loading student profile...
                        </div>

                    ) : error ? (

                        <div className="profile-error-box">
                            {error}
                        </div>

                    ) : (

                        <>

                            {editing && (

                                <div className="student-edit-card">

                                    <div className="student-edit-header">

                                        <h3>
                                            Edit Student Information
                                        </h3>

                                        <p>
                                            Update contact and guardian information.
                                        </p>

                                    </div>


                                    <div className="student-edit-grid">

                                        <div className="student-form-group">

                                            <label>
                                                Phone Number
                                            </label>

                                            <input
                                                type="text"
                                                name="phone"
                                                value={form.phone}
                                                onChange={
                                                    handleFormChange
                                                }
                                                placeholder="Enter phone number"
                                            />

                                        </div>


                                        <div className="student-form-group">

                                            <label>
                                                Guardian Phone
                                            </label>

                                            <input
                                                type="text"
                                                name="guardian_phone"
                                                value={
                                                    form.guardian_phone
                                                }
                                                onChange={
                                                    handleFormChange
                                                }
                                                placeholder="Enter guardian phone"
                                            />

                                        </div>


                                        <div className="student-form-group">

                                            <label>
                                                Guardian Name
                                            </label>

                                            <input
                                                type="text"
                                                name="guardian_name"
                                                value={
                                                    form.guardian_name
                                                }
                                                onChange={
                                                    handleFormChange
                                                }
                                                placeholder="Enter guardian name"
                                            />

                                        </div>


                                        <div className="student-form-group">

                                            <label>
                                                Student Photo
                                            </label>

                                            <input
                                                type="file"
                                                name="photo"
                                                accept="image/*"
                                                onChange={
                                                    handleFormChange
                                                }
                                            />

                                        </div>


                                        <div className="student-form-group full-width">

                                            <label>
                                                Address
                                            </label>

                                            <textarea
                                                name="address"
                                                value={
                                                    form.address
                                                }
                                                onChange={
                                                    handleFormChange
                                                }
                                                placeholder="Enter student's address"
                                                rows="4"
                                            />

                                        </div>

                                    </div>


                                    <div className="student-edit-actions">

                                        <button
                                            type="button"
                                            className="student-cancel-button"
                                            onClick={() => {
                                                setEditing(false);
                                                setSaveError("");
                                            }}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            className="student-save-button"
                                            onClick={
                                                handleSaveStudent
                                            }
                                            disabled={saving}
                                        >
                                            {saving
                                                ? "Saving..."
                                                : "Save Changes"
                                            }
                                        </button>

                                    </div>

                                </div>
                            )}


                            <section className="profile-section">

                                <div className="profile-section-title">
                                    <span>01</span>

                                    <div>
                                        <h3>
                                            Personal Information
                                        </h3>

                                        <p>
                                            Basic student details
                                        </p>
                                    </div>
                                </div>


                                <div className="profile-info-grid">

                                    <div className="profile-info-item">
                                        <span>
                                            Full Name
                                        </span>

                                        <strong>
                                            {student.full_name ||
                                                "Not provided"}
                                        </strong>
                                    </div>


                                    <div className="profile-info-item">
                                        <span>
                                            Student Code
                                        </span>

                                        <strong>
                                            {student.student_code ||
                                                "Not provided"}
                                        </strong>
                                    </div>


                                    <div className="profile-info-item">
                                        <span>
                                            Username
                                        </span>

                                        <strong>
                                            {student.username ||
                                                "Not provided"}
                                        </strong>
                                    </div>


                                    <div className="profile-info-item">
                                        <span>
                                            Email
                                        </span>

                                        <strong>
                                            {student.email ||
                                                "Not provided"}
                                        </strong>
                                    </div>


                                    <div className="profile-info-item">
                                        <span>
                                            Gender
                                        </span>

                                        <strong>
                                            {getGenderLabel(
                                                student.gender
                                            )}
                                        </strong>
                                    </div>


                                    <div className="profile-info-item">
                                        <span>
                                            Date of Birth
                                        </span>

                                        <strong>
                                            {formatDate(
                                                student.date_of_birth
                                            )}
                                        </strong>
                                    </div>

                                </div>

                            </section>


                            <section className="profile-section">

                                <div className="profile-section-title">
                                    <span>02</span>

                                    <div>
                                        <h3>
                                            Contact Information
                                        </h3>

                                        <p>
                                            Student contact details
                                        </p>
                                    </div>
                                </div>


                                <div className="profile-info-grid">

                                    <div className="profile-info-item">
                                        <span>
                                            Phone
                                        </span>

                                        <strong>
                                            {student.phone ||
                                                "Not provided"}
                                        </strong>
                                    </div>


                                    <div className="profile-info-item">
                                        <span>
                                            Address
                                        </span>

                                        <strong>
                                            {student.address ||
                                                "Not provided"}
                                        </strong>
                                    </div>

                                </div>

                            </section>


                            <section className="profile-section">

                                <div className="profile-section-title">
                                    <span>03</span>

                                    <div>
                                        <h3>
                                            Guardian Information
                                        </h3>

                                        <p>
                                            Parent or guardian details
                                        </p>
                                    </div>
                                </div>


                                <div className="guardian-profile-card">

                                    <div>

                                        <span>
                                            Guardian Name
                                        </span>

                                        <strong>
                                            {student.guardian_name ||
                                                "Not provided"}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Guardian Phone
                                        </span>

                                        <strong>
                                            {student.guardian_phone ||
                                                "Not provided"}
                                        </strong>

                                    </div>

                                </div>

                            </section>


                            <section className="profile-section">

                                <div className="profile-section-title">
                                    <span>04</span>

                                    <div>
                                        <h3>
                                            Enrollment
                                        </h3>

                                        <p>
                                            Current class information
                                        </p>
                                    </div>
                                </div>


                                {student.enrollment ? (

                                    <div className="enrollment-profile-card">

                                        <div>
                                            <span>
                                                Class
                                            </span>

                                            <strong>
                                                {
                                                    student
                                                        .enrollment
                                                        .classroom_name
                                                }
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Grade
                                            </span>

                                            <strong>
                                                Grade{" "}
                                                {
                                                    student
                                                        .enrollment
                                                        .grade
                                                }
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Section
                                            </span>

                                            <strong>
                                                {
                                                    student
                                                        .enrollment
                                                        .section
                                                }
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Academic Year
                                            </span>

                                            <strong>
                                                {
                                                    student
                                                        .enrollment
                                                        .academic_year
                                                }
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Enrollment Date
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    student
                                                        .enrollment
                                                        .enrollment_date
                                                )}
                                            </strong>
                                        </div>

                                    </div>

                                ) : (

                                    <div className="student-no-data">
                                        No enrollment information available.
                                    </div>

                                )}

                            </section>


                            <section className="profile-section">

                                <div className="profile-section-title">
                                    <span>05</span>

                                    <div>
                                        <h3>
                                            Academic Performance
                                        </h3>

                                        <p>
                                            Student assessment results
                                        </p>
                                    </div>
                                </div>


                                {results.length === 0 ? (

                                    <div className="student-no-results">

                                        <div>
                                            📚
                                        </div>

                                        <h4>
                                            No results yet
                                        </h4>

                                        <p>
                                            This student does not have
                                            recorded academic results.
                                        </p>

                                    </div>

                                ) : (

                                    <div className="student-results-wrapper">

                                        <div className="student-performance-grid">

                                            <div className="performance-card">

                                                <span>
                                                    Assessments
                                                </span>

                                                <strong>
                                                    {results.length}
                                                </strong>

                                            </div>


                                            <div className="performance-card">

                                                <span>
                                                    Average
                                                </span>

                                                <strong>
                                                    {(
                                                        results.reduce(
                                                            (
                                                                total,
                                                                result
                                                            ) =>
                                                                total +
                                                                Number(
                                                                    result.percentage ||
                                                                    0
                                                                ),
                                                            0
                                                        ) /
                                                        results.length
                                                    ).toFixed(1)}
                                                    %
                                                </strong>

                                            </div>


                                            <div className="performance-card">

                                                <span>
                                                    Passed
                                                </span>

                                                <strong>
                                                    {
                                                        results.filter(
                                                            (result) =>
                                                                result.status ===
                                                                "PASS"
                                                        ).length
                                                    }
                                                </strong>

                                            </div>


                                            <div className="performance-card">

                                                <span>
                                                    Failed
                                                </span>

                                                <strong>
                                                    {
                                                        results.filter(
                                                            (result) =>
                                                                result.status ===
                                                                "FAIL"
                                                        ).length
                                                    }
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="student-results-table">

                                            <div className="results-table-head">

                                                <span>
                                                    Subject
                                                </span>

                                                <span>
                                                    Assessment
                                                </span>

                                                <span>
                                                    Score
                                                </span>

                                                <span>
                                                    Percentage
                                                </span>

                                                <span>
                                                    Status
                                                </span>

                                            </div>


                                            {results.map(
                                                (result) => (

                                                    <div
                                                        className="results-table-row"
                                                        key={
                                                            result.id
                                                        }
                                                    >

                                                        <span>
                                                            {
                                                                result
                                                                    .subject_name ||
                                                                result
                                                                    .subject?.name ||
                                                                "Subject"
                                                            }
                                                        </span>

                                                        <span>
                                                            {
                                                                result.title ||
                                                                formatExamType(
                                                                    result.exam_type
                                                                )
                                                            }
                                                        </span>

                                                        <span>
                                                            {
                                                                result.score
                                                            }
                                                            /
                                                            {
                                                                result.max_score
                                                            }
                                                        </span>

                                                        <span>
                                                            {Number(
                                                                result.percentage ||
                                                                0
                                                            ).toFixed(1)}
                                                            %
                                                        </span>

                                                        <span>

                                                            <span
                                                                className={
                                                                    result.status ===
                                                                    "PASS"
                                                                        ? "result-status pass"
                                                                        : "result-status fail"
                                                                }
                                                            >
                                                                {
                                                                    result.status
                                                                }
                                                            </span>

                                                        </span>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    </div>

                                )}

                            </section>

                        </>
                    )}

                </div>

            </div>

        </div>
    );
}


export default function StudentManagement() {

    const navigate =
        useNavigate();

    const { user } =
        useAuth();


    const [classes, setClasses] =
        useState([]);

    const [students, setStudents] =
        useState([]);

    const [selectedClass, setSelectedClass] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [loadingClasses, setLoadingClasses] =
        useState(true);

    const [loadingStudents, setLoadingStudents] =
        useState(false);

    const [error, setError] =
        useState("");

    const [selectedStudent, setSelectedStudent] =
        useState(null);

    const [profileLoading, setProfileLoading] =
        useState(false);

    const [profileError, setProfileError] =
        useState("");

    const [studentResults, setStudentResults] =
        useState([]);


    useEffect(() => {

        loadClasses();

    }, []);


    async function loadClasses() {

        setLoadingClasses(true);
        setError("");

        try {

            const response =
                await api.get(
                    "/classes/my-classes/"
                );

            const classData =
                getArrayData(
                    response.data
                );

            setClasses(classData);

            if (classData.length > 0) {

                setSelectedClass(
                    String(
                        classData[0].id
                    )
                );

            }

        } catch (error) {

            console.error(
                "Could not load classes:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Could not load your classes."
            );

        } finally {

            setLoadingClasses(false);
        }
    }


    useEffect(() => {

        if (!selectedClass) {
            setStudents([]);
            return;
        }

        loadStudents(
            selectedClass
        );

    }, [selectedClass]);


    async function loadStudents(
        classroomId
    ) {

        setLoadingStudents(true);
        setError("");

        try {

            const response =
                await api.get(
                    `/students/teacher-class/${classroomId}/students/`
                );

            setStudents(
                getArrayData(
                    response.data
                )
            );

        } catch (error) {

            console.error(
                "Could not load students:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Could not load students."
            );

            setStudents([]);

        } finally {

            setLoadingStudents(false);
        }
    }


    async function openStudent(
        student
    ) {

        setSelectedStudent(student);
        setProfileLoading(true);
        setProfileError("");
        setStudentResults([]);

        try {

            const [
                profileResponse,
                resultsResponse,
            ] = await Promise.all([

                api.get(
                    `/students/teacher/${student.id}/`
                ),

                api.get(
                    `/results/results/?student=${student.id}`
                ),

            ]);


            setSelectedStudent(
                profileResponse.data
            );


            setStudentResults(
                getArrayData(
                    resultsResponse.data
                )
            );

        } catch (error) {

            console.error(
                "Could not load student profile:",
                error
            );

            setProfileError(
                error.response?.data?.detail ||
                "Could not load student profile."
            );

        } finally {

            setProfileLoading(false);
        }
    }


    function handleStudentUpdated(
        updatedStudent
    ) {

        setSelectedStudent(
            (previous) => {

                if (!previous) {
                    return updatedStudent;
                }

                return {
                    ...previous,
                    ...updatedStudent,
                };
            }
        );


        setStudents(
            (previousStudents) =>
                previousStudents.map(
                    (student) =>
                        student.id ===
                        updatedStudent.id
                            ? {
                                ...student,
                                ...updatedStudent,
                            }
                            : student
                )
        );
    }


    const filteredStudents =
        useMemo(() => {

            const query =
                search
                    .trim()
                    .toLowerCase();

            if (!query) {
                return students;
            }

            return students.filter(
                (student) => {

                    const name =
                        student.full_name ||
                        "";

                    const code =
                        student.student_code ||
                        "";

                    const username =
                        student.username ||
                        "";

                    return (
                        name
                            .toLowerCase()
                            .includes(query) ||

                        code
                            .toLowerCase()
                            .includes(query) ||

                        username
                            .toLowerCase()
                            .includes(query)
                    );
                }
            );

        }, [
            students,
            search,
        ]);


    const maleCount =
        students.filter(
            (student) =>
                student.gender === "M"
        ).length;


    const femaleCount =
        students.filter(
            (student) =>
                student.gender === "F"
        ).length;


    const selectedClassObject =
        classes.find(
            (item) =>
                String(item.id) ===
                String(selectedClass)
        );


    if (loadingClasses) {

        return (
            <div className="student-management-page">

                <div className="student-page-loading">

                    <div className="loading-spinner">
                        ⟳
                    </div>

                    <h3>
                        Loading student management...
                    </h3>

                </div>

            </div>
        );
    }


    return (
        <div className="student-management-page">

            <header className="student-management-header">

                <div>

                    <button
                        type="button"
                        className="back-to-dashboard"
                        onClick={() =>
                            navigate(
                                "/teacher/dashboard"
                            )
                        }
                    >
                        ← Dashboard
                    </button>

                    <span className="page-eyebrow">
                        TEACHER WORKSPACE
                    </span>

                    <h1>
                        Student Management
                    </h1>

                    <p>
                        Manage and review students
                        from your assigned classes.
                    </p>

                </div>


                <div className="teacher-mini-profile">

                    <div className="teacher-mini-avatar">
                        {getInitials(
                            user?.full_name ||
                            user?.username
                        )}
                    </div>

                    <div>

                        <strong>
                            {user?.full_name ||
                                user?.username ||
                                "Teacher"}
                        </strong>

                        <span>
                            Teacher
                        </span>

                    </div>

                </div>

            </header>


            <main className="student-management-content">

                <section className="student-control-card">

                    <div className="class-selection-area">

                        <div>

                            <span className="control-label">
                                SELECT CLASS
                            </span>

                            <h2>
                                {selectedClassObject?.name ||
                                    "Choose a class"}
                            </h2>

                        </div>


                        <select
                            value={selectedClass}
                            onChange={(event) =>
                                setSelectedClass(
                                    event.target.value
                                )
                            }
                            className="class-selector"
                        >

                            {classes.length === 0 ? (

                                <option value="">
                                    No classes assigned
                                </option>

                            ) : (

                                classes.map(
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
                                )
                            )}

                        </select>

                    </div>


                    <div className="student-search-box">

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
                            placeholder="Search by student name, code or username..."
                        />

                        {search && (

                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                            >
                                ×
                            </button>

                        )}

                    </div>

                </section>


                {error && (

                    <div className="student-page-error">

                        <strong>
                            Something went wrong
                        </strong>

                        <span>
                            {error}
                        </span>

                    </div>

                )}


                <section className="student-stats-grid">

                    <StatCard
                        label="Total Students"
                        value={students.length}
                        icon="👥"
                    />

                    <StatCard
                        label="Male Students"
                        value={maleCount}
                        icon="♂"
                    />

                    <StatCard
                        label="Female Students"
                        value={femaleCount}
                        icon="♀"
                    />

                    <StatCard
                        label="Showing"
                        value={
                            filteredStudents.length
                        }
                        icon="⌕"
                    />

                </section>


                <section className="student-list-card">

                    <div className="student-list-header">

                        <div>

                            <span className="section-eyebrow">
                                STUDENT DIRECTORY
                            </span>

                            <h2>
                                {selectedClassObject?.name ||
                                    "Students"}
                            </h2>

                        </div>

                        <span className="student-count-badge">
                            {filteredStudents.length}
                            {" "}
                            student
                            {filteredStudents.length !==
                            1
                                ? "s"
                                : ""}
                        </span>

                    </div>


                    {loadingStudents ? (

                        <div className="student-table-loading">

                            <div className="loading-spinner">
                                ⟳
                            </div>

                            <span>
                                Loading students...
                            </span>

                        </div>

                    ) : filteredStudents.length ===
                      0 ? (

                        <EmptyStudents />

                    ) : (

                        <div className="student-table-wrapper">

                            <table className="student-table">

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
                                            Phone
                                        </th>

                                        <th>
                                            Guardian
                                        </th>

                                        <th>
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredStudents.map(
                                        (student) => (

                                            <tr
                                                key={
                                                    student.id
                                                }
                                            >

                                                <td>

                                                    <div className="student-name-cell">

                                                        <StudentAvatar
                                                            student={
                                                                student
                                                            }
                                                        />

                                                        <div>

                                                            <strong>
                                                                {
                                                                    student.full_name ||
                                                                    "Unnamed Student"
                                                                }
                                                            </strong>

                                                            <span>
                                                                @
                                                                {
                                                                    student.username ||
                                                                    "student"
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>


                                                <td>

                                                    <span className="student-code-badge">
                                                        {
                                                            student.student_code ||
                                                            "N/A"
                                                        }
                                                    </span>

                                                </td>


                                                <td>

                                                    {
                                                        getGenderLabel(
                                                            student.gender
                                                        )
                                                    }

                                                </td>


                                                <td>

                                                    {
                                                        student.phone ||
                                                        "Not provided"
                                                    }

                                                </td>


                                                <td>

                                                    {
                                                        student.guardian_name ||
                                                        "Not provided"
                                                    }

                                                </td>


                                                <td>

                                                    <button
                                                        type="button"
                                                        className="view-student-button"
                                                        onClick={() =>
                                                            openStudent(
                                                                student
                                                            )
                                                        }
                                                    >
                                                        View Profile
                                                        →
                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>


            {selectedStudent && (

                <StudentProfilePanel
                    student={
                        selectedStudent
                    }
                    results={
                        studentResults
                    }
                    loading={
                        profileLoading
                    }
                    error={
                        profileError
                    }
                    onClose={() =>
                        setSelectedStudent(
                            null
                        )
                    }
                    onUpdated={
                        handleStudentUpdated
                    }
                />

            )}

        </div>
    );
}