import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";

export default function Sidebar({ user, onSelectUser }) {
  const [search, setSearch] = useState("");
  const [recentChats, setRecentChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // Fetch recent chats
  useEffect(() => {
    const fetchRecentChats = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          sender_id,
          receiver_id,
          last_message,
          updated_at,
          profiles!messages_sender_id_fkey (id, username, email)
        `
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (error) console.error(error);
      else {
        // Map to show other user info
        const chats = data.map((c) => {
          const otherUser =
            c.sender_id === user.id
              ? c.profiles
              : c.receiver_id === user.id
              ? c.profiles
              : null;
          return {
            id: otherUser.id,
            username: otherUser.username,
            email: otherUser.email,
            last_message: c.last_message,
          };
        });
        setRecentChats(chats);
      }
    };
    fetchRecentChats();
  }, [user.id]);

  // Search for any user not in recent chats
  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      return;
    }
    const fetchUsers = async () => {
      // Get IDs of users already in recent chats
      const recentIds = recentChats.map((c) => c.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email")
        .neq("id", user.id)
        .not("id", "in", `(${recentIds.join(",")})`)
        .ilike("username", `%${search}%`);
      if (error) console.error(error);
      else setSearchResults(data || []);
    };
    fetchUsers();
  }, [search, user.id, recentChats]);

  const displayUsers = search ? searchResults : recentChats;

  return (
    <div className="w-80 bg-white shadow-md p-4 flex flex-col">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Pingly 💬</h2>
      <h2>{user.email}</h2>
      {/* Search bar */}
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded mb-4 focus:ring-2 focus:ring-blue-400"
      />

      <h3 className="text-gray-600 text-sm mb-2">
        {search ? "Search Results" : "Recent Chats"}
      </h3>
      <div className="flex-1 overflow-y-auto">
        {displayUsers.length > 0 ? (
          displayUsers.map((u) => (
            <div
              key={u.id}
              onClick={() => onSelectUser(u)}
              className="p-2 hover:bg-blue-50 rounded cursor-pointer"
            >
              <p className="font-semibold">{u.username}</p>
              <p className="text-xs text-gray-500">{u.email}</p>
              {!search && u.last_message && (
                <p className="text-xs text-gray-400 truncate">
                  {u.last_message}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">
            {search ? "No users found." : "No recent chats."}
          </p>
        )}
      </div>
    </div>
  );
}
