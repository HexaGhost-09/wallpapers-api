import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { wallpapers as allWallpapers } from "./data.ts"; // Import all wallpapers

const app = new Application();
const router = new Router();

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

// Handle OPTIONS requests (preflight for CORS)
app.use(router.routes());
app.use(router.allowedMethods());

router.options("/wallpapers", (ctx) => {
  ctx.response.status = 204; // No Content
});

// Define the /wallpapers route with pagination
router.get("/wallpapers", (ctx) => {
  const query = ctx.request.url.searchParams;

  // Parse 'page' and 'limit' from query parameters
  // Default to page 1 and limit 20 if not provided or invalid
  const page = parseInt(query.get("page") || "1");
  const limit = parseInt(query.get("limit") || "20");

  // Ensure page and limit are positive numbers
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);

  // Calculate start and end indices for slicing
  const startIndex = (safePage - 1) * safeLimit;
  const endIndex = startIndex + safeLimit;

  // Slice the wallpapers array to get the current page's data
  const paginatedWallpapers = allWallpapers.slice(startIndex, endIndex);

  ctx.response.body = paginatedWallpapers;
  ctx.response.type = "application/json";
});

// Add a health check endpoint
router.get("/health", (ctx) => {
  ctx.response.body = { status: "ok" };
  ctx.response.type = "application/json";
});

const PORT = 8000; // Your Deno API port
console.log(`Server running on http://localhost:${PORT}`);
await app.listen({ port: PORT });

