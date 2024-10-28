// supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ncyvphstqxbcxblkgsne.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXZwaHN0cXhiY3hibGtnc25lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAxNDY5NzcsImV4cCI6MjA0NTcyMjk3N30.JiEeCa6ubOZISKAyx2CvPizBcYkToNeuJ6LfS8uBxv4"; // Ganti dengan Kunci Anon Supabase Anda
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
