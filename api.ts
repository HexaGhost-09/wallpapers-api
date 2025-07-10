import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";

// Utility to read and parse a JSON file
async function readJson<T>(path: string): Promise<T> {
  const data = await Deno.readTextFile(path);
  return JSON.parse(data);
}

serve(async (req) => {
  const url = new URL(req.url);

  // Get all wallpapers in all categories (newest first)
  if (url.pathname === "/wallpapers") {
    const categories = await readJson<Array<{id: string}>>("./data/categories.json");
    let allWallpapers: any[] = [];

    for (const cat of categories) {
      try {
        const wallpapers = await readJson<any[]>(`./data/categories/${cat.id}.json`);
        wallpapers.forEach(w => w.category = cat.id);
        allWallpapers = allWallpapers.concat(wallpapers);
      } catch {
        // ignore if file does not exist
      }
    }

    allWallpapers.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return new Response(JSON.stringify(allWallpapers), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Get all categories
  if (url.pathname === "/categories") {
    return await serveFile(req, "./data/categories.json");
  }

  // Get wallpapers for a specific category
  const categoryMatch = url.pathname.match(/^\/categories\/([\w-]+)$/);
  if (categoryMatch) {
    const category = categoryMatch[1];
    return await serveFile(req, `./data/categories/${category}.json`);
  }

  // Serve anime.json at /anime (legacy route, optional)
  if (url.pathname === "/anime") {
    return await serveFile(req, "./data/dmy/anime.json");
  }

  // Download endpoint: /download/:id returns the download info for a wallpaper
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

  // 404 for all other routes
  return new Response("Not Found", { status: 404 });
});