import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";

export default function Sidebar({ user, onSelectUser }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);

  // Fetch all other users
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email")
        .neq("id", user.id)
        .ilike("email", `%${search}%`);

      if (error) console.error(error);
      else setUsers(data || []);
    };
    fetchUsers();
  }, [search, user.id]);

  return (
    <div className="w-80 bg-white shadow-md p-4 flex flex-col">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Pingly 💬</h2>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded mb-4 focus:ring-2 focus:ring-blue-400"
      />

      <h3 className="text-gray-600 text-sm mb-2">Users</h3>
      <div className="flex-1 overflow-y-auto">
        {users.length > 0 ? (
          users.map((u) => (
            <div
              key={u.id}
              onClick={() => onSelectUser(u)}
              className="p-2 hover:bg-blue-50 rounded cursor-pointer"
            >
              <p className="font-semibold">{u.username}</p>
              <p className="text-xs text-gray-500">{u.email}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No users found.</p>
        )}
      </div>
    </div>
  );
}
