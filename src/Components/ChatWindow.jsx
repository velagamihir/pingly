import { useEffect, useState } from "react";
import { supabase } from "../SupabaseClient";

export default function ChatWindow({ user, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // Fetch chat messages between logged-in user and selectedUser
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) console.error(error);
      else setMessages(data || []);
    };

    fetchMessages();

    // Realtime updates
    const channel = supabase
      .channel("realtime:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === user.id &&
              newMsg.receiver_id === selectedUser.id) ||
            (newMsg.sender_id === selectedUser.id &&
              newMsg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, user.id]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const { error } = await supabase.from("messages").insert([
      {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content: text,
      },
    ]);
    if (error) console.error(error);
    else setText("");
  };

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-lg">
        Select a user to start chatting 💬
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white shadow flex items-center justify-between">
        <h2 className="font-bold text-lg text-blue-600">
          {selectedUser.username || selectedUser.email}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender_id === user.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-2xl max-w-xs ${
                msg.sender_id === user.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border p-2 rounded focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
