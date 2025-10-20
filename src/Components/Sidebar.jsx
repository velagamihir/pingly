import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";

export default function Sidebar({ user, onSelectUser }) {
  const [search, setSearch] = useState("");
  const [recentChats, setRecentChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // Fetch recent chats
  const fetchRecentChats = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
      sender_id,
      receiver_id,
      last_message,
      updated_at,
      sender:profiles!messages_sender_id_fkey (id, username, email),
      receiver:profiles!messages_receiver_id_fkey (id, username, email)
    `
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    // Filter distinct other users
    const chats = [];
    const addedIds = new Set();

    data.forEach((c) => {
      const isCurrentUserSender = c.sender_id === user.id;
      const otherUserId = isCurrentUserSender ? c.receiver_id : c.sender_id;
      const profile = isCurrentUserSender ? c.receiver : c.sender;

      // Only add if:
      // 1. We have a valid other user ID
      // 2. The other user is NOT the current user (safety check)
      // 3. We haven't already added this user
      if (
        otherUserId &&
        otherUserId !== user.id &&
        !addedIds.has(otherUserId)
      ) {
        addedIds.add(otherUserId);
        chats.push({
          id: profile.id,
          username: profile.username,
          email: profile.email,
          last_message: c.last_message,
          updated_at: c.updated_at,
        });
      }
    });

    setRecentChats(chats);
  };

  // Initial fetch + real-time subscription
  useEffect(() => {
    fetchRecentChats();

    // Subscribe to real-time changes in messages table
    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`, // Messages sent by current user
        },
        () => {
          fetchRecentChats(); // Refresh when current user sends a message
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`, // Messages received by current user
        },
        () => {
          fetchRecentChats(); // Refresh when current user receives a message
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  // Search for users not in recent chats
  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      return;
    }

    const fetchUsers = async () => {
      const recentIds = recentChats.map((c) => c.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email")
        .neq("id", user.id) // exclude logged-in user
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
      <h2 className="text-sm text-gray-700 mb-4">{user.email}</h2>

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
