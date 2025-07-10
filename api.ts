import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";

// Utility to read and parse a JSON file
async function readJson<T>(path: string): Promise<T> {
  const data = await Deno.readTextFile(path);
  return JSON.parse(data);
}

serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/wallpapers") {
    // 1. Read categories to get all category IDs
    const categories = await readJson<Array<{id: string}>>("./data/categories.json");
    let allWallpapers: any[] = [];

    // 2. For each category, read its wallpapers
    for (const cat of categories) {
      try {
        const wallpapers = await readJson<any[]>(`./data/categories/${cat.id}.json`);
        wallpapers.forEach(w => w.category = cat.id);
        allWallpapers = allWallpapers.concat(wallpapers);
      } catch {
        // ignore if file does not exist
      }
    }

    // 3. Sort by timestamp (newest first, ISO 8601 compatible)
    allWallpapers.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return new Response(JSON.stringify(allWallpapers), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (url.pathname === "/categories") {
    return await serveFile(req, "./data/categories.json");
  }

  // Serve a specific category's wallpapers
  const categoryMatch = url.pathname.match(/^\/categories\/([\w-]+)$/);
  if (categoryMatch) {
    const category = categoryMatch[1];
    return await serveFile(req, `./data/categories/${category}.json`);
  }

  // Serve space.json at /spaces
  if (url.pathname === "/spaces") {
    return await serveFile(req, "./data/space.json");
  }

  // Serve anime.json at /anime
  if (url.pathname === "/anime") {
    return await serveFile(req, "./data/dmy/anime.json");
  }

  // ----------- NEW: Download endpoint -----------
  // GET /download/:id returns { download: "...", image: "...", title: "...", category: "..." }
  const downloadMatch = url.pathname.match(/^\/download\/([\w-]+)$/);
  if (downloadMatch) {
    const id = downloadMatch[1];
    const categories = await readJson<Array<{id: string}>>("./data/categories.json");
    for (const cat of categories) {
      try {
        const wallpapers = await readJson<any[]>(`./data/categories/${cat.id}.json`);
        const found = wallpapers.find(w => w.id === id);
        if (found && found.download) {
          return new Response(
            JSON.stringify({
              download: found.download,
              image: found.image,
              title: found.title,
              category: cat.id
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
      } catch {}
    }
    return new Response(
      JSON.stringify({ error: "Wallpaper not found or no download available" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  // ----------------------------------------------

  return new Response("Not Found", { status: 404 });
});