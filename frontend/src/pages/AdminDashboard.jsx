import {
    useAuth,
} from "../context/AuthContext";


function AdminDashboard() {

    const {
        user,
        logout,
    } = useAuth();


    return (

        <div className="dashboard-page">

            <header className="dashboard-header">

                <div>
                    <h1>
                        Admin Dashboard
                    </h1>

                    <p>
                        Welcome, {user?.first_name}{" "}
                        {user?.last_name}
                    </p>
                </div>


                <button
                    onClick={logout}
                    className="logout-button"
                >
                    Logout
                </button>

            </header>


            <main className="dashboard-content">

                <div className="welcome-card">

                    <h2>
                        Administrator
                    </h2>

                    <p>
                        You are logged in as an
                        administrator.
                    </p>

                    <div className="role-badge">
                        {user?.role}
                    </div>

                </div>

            </main>

        </div>
    );
}


export default AdminDashboard;