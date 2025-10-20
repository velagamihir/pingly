import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://asocmvmokqcxbdhlmfgo.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzb2Ntdm1va3FjeGJkaGxtZmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTg4NjYsImV4cCI6MjA3NjQ5NDg2Nn0.WKt4h61H44wRRv4-6t4UCirbmseVsjDnrpXN6pLEH7k";
export const supabase = createClient(supabaseUrl, supabaseKey);
