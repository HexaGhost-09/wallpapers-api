import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { join } from "https://deno.land/std@0.207.0/path/mod.ts";

const app = new Application();
const router = new Router();

// Helper to read all wallpapers from your JSON files
async function getAllWallpapers(): Promise<any[]> {
  const categoriesPath = join(Deno.cwd(), "data/categories");
  const files = [
    "anime.json",
    "cars.json",
    "nature.json",
  ];

  let wallpapers: any[] = [];
  for (const file of files) {
    try {
      const filePath = join(categoriesPath, file);
      const data = await Deno.readTextFile(filePath);
      const json = JSON.parse(data);
      // If your JSON is an array, push all; if object, adjust accordingly
      if (Array.isArray(json)) {
        wallpapers = wallpapers.concat(json);
      } else if (json.wallpapers && Array.isArray(json.wallpapers)) {
        wallpapers = wallpapers.concat(json.wallpapers);
      }
    } catch (_e) {
      // Skip missing/corrupt files
    }
  }
  return wallpapers;
}

// Helper to get categories list
async function getCategories(): Promise<any> {
  const categoriesFile = join(Deno.cwd(), "data/categories/categories.json");
  try {
    const data = await Deno.readTextFile(categoriesFile);
    return JSON.parse(data);
  } catch (_e) {
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

// OPTIONS preflight (for all endpoints)
router.options("/wallpapers", (ctx) => { ctx.response.status = 204; });
router.options("/categories", (ctx) => { ctx.response.status = 204; });
router.options("/health", (ctx) => { ctx.response.status = 204; });

// Wallpapers endpoint (paginated, default 10 per page)
router.get("/wallpapers", async (ctx) => {
  const query = ctx.request.url.searchParams;
  const page = parseInt(query.get("page") || "1");
  const limit = parseInt(query.get("limit") || "10");
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);

  const allWallpapers = await getAllWallpapers();
  const startIndex = (safePage - 1) * safeLimit;
  const endIndex = startIndex + safeLimit;
  const paginatedWallpapers = allWallpapers.slice(startIndex, endIndex);

  ctx.response.body = paginatedWallpapers;
  ctx.response.type = "application/json";
});

// Get all categories
router.get("/categories", async (ctx) => {
  const categories = await getCategories();
  ctx.response.body = categories;
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
    let wallpapers: any[] = [];
    const json = JSON.parse(data);
    if (Array.isArray(json)) {
      wallpapers = json;
    } else if (json.wallpapers && Array.isArray(json.wallpapers)) {
      wallpapers = json.wallpapers;
    }
    const startIndex = (safePage - 1) * safeLimit;
    const endIndex = startIndex + safeLimit;
    ctx.response.body = wallpapers.slice(startIndex, endIndex);
    ctx.response.type = "application/json";
  } catch (_e) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Category not found" };
    ctx.response.type = "application/json";
  }
});

// Health check endpoint
router.get("/health", (ctx) => {
  ctx.response.body = { status: "ok" };
  ctx.response.type = "application/json";
});

const PORT = 8000;
console.log(`Server running on http://localhost:${PORT}`);
await app.listen({ port: PORT });