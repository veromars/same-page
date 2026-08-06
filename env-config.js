// Browser-visible Supabase config, loaded by supabase-client.js.
//
// This file IS committed on purpose: the site is served as static files with
// no build step, so a gitignored copy simply doesn't exist on Vercel/GitHub
// Pages and the app comes up with no backend at all.
//
// Only the anon key belongs here. It is public by design and every table it
// can reach is protected by RLS. The service_role key must never appear in
// this file — it lives in .env, which stays gitignored.
window.__ENV__ = {
  SUPABASE_URL: 'https://wtvsctwcdoyrgchruwvw.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0dnNjdHdjZG95cmdjaHJ1d3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2ODAzNDksImV4cCI6MjEwMTI1NjM0OX0.GLrPZ1SKJIRz6RXpV9j0GSVO2n8wPCPp61CEz2VKf8A',
};
