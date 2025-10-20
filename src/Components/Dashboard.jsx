import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error(error);
      else setUser(data.user);
    };
    fetchUser();
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading your account...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} onSelectUser={setSelectedUser} />
      <div className="flex-1">
        <ChatWindow user={user} selectedUser={selectedUser} />
      </div>
    </div>
  );
}
