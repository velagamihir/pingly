import { useState } from "react";
import { supabase } from "../SupabaseClient";
import { useNavigate } from "react-router-dom";
import "../output.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setError("");
    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          console.err(error);
          if (error.message.includes("User already registered")) {
            // Gracefully handle duplicate signup attempt
            setError("This email is already registered. Please login instead.");
            setIsSignup(false);
          } else {
            setError(error.message);
          }
        } else {
          alert(
            "✅ Check your email for the verification link before logging in!"
          );
          setIsSignup(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) setError(error.message);
        else navigate("/dashboard"); // redirect to your main app
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <div className="bg-white p-8 rounded-2xl shadow-md w-96 text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Pingly 💬</h1>
        <h2 className="text-lg font-semibold mb-4">
          {isSignup ? "Create your account" : "Welcome back"}
        </h2>

        <input
          type="email"
          className="w-full border border-gray-300 p-2 rounded mb-3 focus:ring-2 focus:ring-blue-400"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full border border-gray-300 p-2 rounded mb-4 focus:ring-2 focus:ring-blue-400"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 mb-2 text-sm">{error}</p>}

        <button
          onClick={handleAuth}
          disabled={loading}
          className={`w-full ${
            loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white py-2 rounded font-semibold mb-3`}
        >
          {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
        </button>

        <p className="text-sm text-gray-600">
          {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
          <span
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            className="text-blue-500 cursor-pointer hover:underline"
          >
            {isSignup ? "Login" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}
