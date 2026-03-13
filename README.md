# Class Manager

A Vue 3 Progressive Web App boilerplate built with Vite.

## Tech Stack

- **Vue 3** — Composition API with `<script setup>`
- **TypeScript** — Full type safety
- **Vite** — Lightning-fast dev server and build tool
- **Vue Router** — Client-side routing with lazy loading
- **Pinia** — Intuitive state management
- **vite-plugin-pwa** — Service worker generation, offline support, installability

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── assets/          # Global styles
├── components/      # Reusable components
├── router/          # Vue Router configuration
├── stores/          # Pinia stores
├── views/           # Route-level components
├── App.vue          # Root component
└── main.ts          # App entry point
```

## PWA

The app is configured as a Progressive Web App with:

- Auto-updating service worker
- Offline caching with Workbox
- Web app manifest for installability
- Placeholder icons (replace with your own)

To generate proper PWA icons from a source image, use:

```bash
npx @vite-pwa/assets-generator --preset minimal public/logo.svg
```
