import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import { FiMenu, FiX } from "react-icons/fi";

export default function Sidebar({ user, onSelectUser }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false); // for mobile menu

  // Fetch all users except current user
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email")
        .neq("id", user.id)
        .ilike("username", `%${search}%`); // search by username

      if (error) console.error(error);
      else setUsers(data || []);
    };
    fetchUsers();
  }, [search, user.id]);

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="md:hidden flex items-center p-2 bg-white shadow">
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <h2 className="ml-2 text-xl font-bold text-blue-600">Pingly 💬</h2>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed md:relative top-0 left-0 z-50 h-full w-80 bg-white shadow-md p-4 flex flex-col transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <h2 className="text-2xl font-bold text-blue-600 mb-4 hidden md:block">
          Pingly 💬
        </h2>

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
                onClick={() => {
                  onSelectUser(u);
                  setIsOpen(false); // close sidebar on mobile after selecting
                }}
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
    </>
  );
}
