# Wallora-2 Wallpapers API

A simple Deno-powered API for wallpaper data.

## Categories

- **nature** – Beautiful landscapes and natural scenes
- **cars** – Cool cars and automotive wallpapers
- **anime** – Anime-themed wallpapers and artwork
- **space** – Space, cosmos, and astronomy

## API Endpoints

<details>
<summary>Show/Hide all endpoints</summary>

- `GET /wallpapers`  
  Returns all wallpapers (newest first).

- `GET /categories`  
  Returns all categories (nature, cars, anime, space).

- `GET /categories/nature`  
  Returns all wallpapers in the nature category.

- `GET /categories/cars`  
  Returns all wallpapers in the cars category.

- `GET /categories/anime`  
  Returns all wallpapers in the anime category.

- `GET /categories/space`  
  Returns all wallpapers in the space category.

</details>

## Running the API

```sh
deno run --allow-net --allow-read api.ts
```

## Data Structure

Data is stored in the `data/` directory as JSON files:

- Categories: `data/categories.json`
- Wallpapers for each category: `data/categories/{category}.json`

## Contributing

Feel free to open issues or PRs to suggest improvements or add new wallpaper categories!

---