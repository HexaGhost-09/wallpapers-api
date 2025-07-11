import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { join } from "https://deno.land/std@0.207.0/path/mod.ts";

const app = new Application();
const router = new Router();

// Define a type for a Wallpaper to ensure consistency
interface Wallpaper {
  id: string;
  category: string;
  url: string;
  thumbnail: string;
  timestamp: string; // ISO 8601 string
}

// Helper to read all wallpapers from your JSON files and sort them by timestamp
async function getAllWallpapers(): Promise<Wallpaper[]> {
  const categoriesPath = join(Deno.cwd(), "data/categories");
  const files = [
    "anime.json",
    "cars.json",
    "nature.json",
  ];

  let wallpapers: Wallpaper[] = [];
  for (const file of files) {
    try {
      const filePath = join(categoriesPath, file);
      const data = await Deno.readTextFile(filePath);
      const json = JSON.parse(data);
      if (Array.isArray(json)) {
        wallpapers = wallpapers.concat(json);
      } else if (json.wallpapers && Array.isArray(json.wallpapers)) {
        wallpapers = wallpapers.concat(json.wallpapers);
      }
    } catch (_e) {
      // Skip missing/corrupt files, log the error for debugging if needed
      console.error(`Error reading or parsing file ${file}: ${_e.message}`);
    }
  }

  // Sort wallpapers by timestamp in descending order (newest first)
  wallpapers.sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime(); // Descending order
  });

  return wallpapers;
}

// Read categories.json as-is (fixed path)
async function getCategoriesList(): Promise<any[]> {
  const categoriesFile = join(Deno.cwd(), "data/categories.json");
  try {
    const data = await Deno.readTextFile(categoriesFile);
    const json = JSON.parse(data);
    if (Array.isArray(json)) {
      return json;
    }
    // If not array, wrap in array (fallback)
    return [json];
  } catch (_e) {
    console.error(`Error reading or parsing categories.json: ${_e.message}`);
    return [];
  }
}

// Logger middleware
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// Timing middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  await next();
});

app.use(router.routes());
app.use(router.allowedMethods());

// OPTIONS preflight
router.options("/wallpapers", (ctx) => { ctx.response.status = 204; });
router.options("/categories", (ctx) => { ctx.response.status = 204; });
router.options("/health", (ctx) => { ctx.response.status = 204; });
router.options("/wallpapers/:category", (ctx) => { ctx.response.status = 204; });

// Wallpapers endpoint (paginated, default 10 per page, sorted by timestamp)
router.get("/wallpapers", async (ctx) => {
  const query = ctx.request.url.searchParams;
  const page = parseInt(query.get("page") || "1");
  const limit = parseInt(query.get("limit") || "10");
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);

  const allWallpapers = await getAllWallpapers(); // This now returns sorted wallpapers
  const startIndex = (safePage - 1) * safeLimit;
  const endIndex = startIndex + safeLimit;
  const paginatedWallpapers = allWallpapers.slice(startIndex, endIndex);

  ctx.response.body = paginatedWallpapers;
  ctx.response.type = "application/json";
});

// List wallpapers by category (paginated, default 10 per page)
router.get("/wallpapers/:category", async (ctx) => {
  const category = ctx.params.category;
  const query = ctx.request.url.searchParams;
  const page = parseInt(query.get("page") || "1");
  const limit = parseInt(query.get("limit") || "10");
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);

  const filePath = join(Deno.cwd(), "data/categories", `${category}.json`);
  try {
    const data = await Deno.readTextFile(filePath);
    let wallpapers: Wallpaper[] = [];
    const json = JSON.parse(data);
    if (Array.isArray(json)) {
      wallpapers = json;
    } else if (json.wallpapers && Array.isArray(json.wallpapers)) {
      wallpapers = json.wallpapers;
    }

    // Sort wallpapers by timestamp in descending order for category-specific endpoint as well
    wallpapers.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime(); // Descending order
    });

    const startIndex = (safePage - 1) * safeLimit;
    const endIndex = startIndex + safeLimit;
    ctx.response.body = wallpapers.slice(startIndex, endIndex);
    ctx.response.type = "application/json";
  } catch (_e) {
    console.error(`Error fetching category ${category}: ${_e.message}`);
    ctx.response.status = 404;
    ctx.response.body = { error: "Category not found" };
    ctx.response.type = "application/json";
  }
});

// Categories endpoint (fixed path)
router.get("/categories", async (ctx) => {
  const categories = await getCategoriesList();
  ctx.response.body = categories;
  ctx.response.type = "application/json";
});

// Health check endpoint
router.get("/health", (ctx) => {
  ctx.response.body = { status: "ok" };
  ctx.response.type = "application/json";
});

const PORT = 8000;
console.log(`Server running on http://localhost:${PORT}`);
await app.listen({ port: PORT });
