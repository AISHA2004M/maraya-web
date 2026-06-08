import { useEffect, useState } from "react";
import { getUsers, updateUserRole } from "../api/users";
import { Users as UsersIcon, Shield, RefreshCw } from "lucide-react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getUsers().then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (user) => {
    const newRole = user.role === "admin" ? "customer" : "admin";
    if (!confirm(`Set ${user.email} as ${newRole}?`)) return;
    try {
      await updateUserRole(user.id, newRole);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
    } catch {
      alert("Failed to update role");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
            <UsersIcon size={22} />
            Users
          </h1>
          <p className="text-secondary text-sm">{users.length} registered users</p>
        </div>
        <button onClick={load} className="btn-ghost">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="admin-card !p-0 overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={3} className="text-center text-secondary py-8">Loading...</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={3} className="text-center text-secondary py-8">No users yet.</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div>
                    <p className="font-medium text-sm">{u.full_name || "—"}</p>
                    <p className="text-xs text-secondary">{u.email}</p>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${u.role === "admin" ? "status-completed" : "status-pending"}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleRole(u)}
                    className="btn-ghost text-xs py-1.5 px-3"
                  >
                    <Shield size={12} />
                    {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
