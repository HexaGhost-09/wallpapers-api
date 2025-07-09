# Wallora-2 Wallpapers API

A simple Deno-powered API for wallpaper data.

## Endpoints

- `GET /wallpapers`  
  Returns all wallpapers (newest first).

- `GET /categories`  
  Returns all categories.

- `GET /categories/:category`  
  Returns all wallpapers in a category (newest first).

## Running the API

```sh
deno run --allow-net --allow-read api.ts
```

Data is stored in the `data/` directory as JSON files.