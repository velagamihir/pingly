import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import { Menu, X } from "lucide-react"; // icons

export default function Sidebar({ user, onSelectUser }) {
  const [search, setSearch] = useState("");
  const [recentChats, setRecentChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false); // sidebar toggle

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

    const chats = [];
    const addedIds = new Set();

    data.forEach((c) => {
      const isCurrentUserSender = c.sender_id === user.id;
      const otherUserId = isCurrentUserSender ? c.receiver_id : c.sender_id;
      const profile = isCurrentUserSender ? c.receiver : c.sender;

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

  useEffect(() => {
    fetchRecentChats();

    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (
            payload.new?.sender_id === user.id ||
            payload.new?.receiver_id === user.id
          ) {
            fetchRecentChats();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user.id]);

  // Search users
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
        .neq("id", user.id)
        .not("id", "in", `(${recentIds.join(",") || "0"})`)
        .ilike("username", `%${search}%`);

      if (error) console.error(error);
      else setSearchResults(data || []);
    };

    fetchUsers();
  }, [search, user.id, recentChats]);

  const displayUsers = search ? searchResults : recentChats;

  return (
    <>
      {/* Hamburger button - only on mobile */}
      <button
        className="sm:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar container */}
      <div
        className={`
          fixed sm:static top-0 left-0 
          h-full sm:h-screen
          w-64 sm:w-80 
          bg-white dark:bg-gray-900 
          shadow-md border-r border-gray-200 dark:border-gray-700
          transform sm:translate-x-0 
          transition-transform duration-300 ease-in-out 
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          z-40 flex flex-col p-4
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-600">
            Pingly 💬
          </h2>
          {/* Close button inside sidebar (mobile only) */}
          <button
            className="sm:hidden text-gray-500 dark:text-gray-300"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current user */}
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 truncate">
          {user.email}
        </p>

        {/* Search bar */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full border border-gray-300 dark:border-gray-700 
              bg-gray-50 dark:bg-gray-800 
              text-sm sm:text-base text-gray-800 dark:text-gray-200 
              p-2 rounded-xl 
              focus:ring-2 focus:ring-blue-400 
              transition-all duration-200
            "
          />
        </div>

        {/* Section title */}
        <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-2 uppercase tracking-wide">
          {search ? "Search Results" : "Recent Chats"}
        </h3>

        {/* Users list */}
        <div
          className="
            flex-1 overflow-y-auto 
            scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-transparent
          "
        >
          {displayUsers.length > 0 ? (
            displayUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  setIsOpen(false); // close sidebar on mobile after selecting
                }}
                className="
                  p-2 sm:p-3 
                  mb-1 rounded-xl 
                  cursor-pointer 
                  transition-colors 
                  hover:bg-blue-50 dark:hover:bg-gray-800
                  group
                "
              >
                <p className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-100 group-hover:text-blue-600">
                  {u.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {u.email}
                </p>
                {!search && u.last_message && (
                  <p className="text-xs text-gray-400 truncate italic">
                    {u.last_message}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-4">
              {search ? "No users found." : "No recent chats."}
            </p>
          )}
        </div>
      </div>

      {/* Overlay (when sidebar is open on mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 sm:hidden z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
