import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  console.log("Request Path:", url.pathname);  // 👈 add this line

  if (url.pathname === "/categories.json") {
    return await serveFile(req, "./categories.json");
  }

  if (url.pathname.startsWith("/categories/")) {
    return await serveFile(req, "." + url.pathname);
  }

  return new Response("Not Found", { status: 404 });
});