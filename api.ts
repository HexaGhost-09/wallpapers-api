import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";

serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/wallpapers") {
    return await serveFile(req, "./data/wallpapers.json");
  }

  if (url.pathname === "/categories") {
    return await serveFile(req, "./data/categories.json");
  }

  const categoryMatch = url.pathname.match(/^\/categories\/([\w-]+)$/);
  if (categoryMatch) {
    const category = categoryMatch[1];
    return await serveFile(req, `./data/categories/${category}.json`);
  }

  return new Response("Not Found", { status: 404 });
});