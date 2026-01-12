# EQ-5D-5L TTO

## Getting started

Requires Node.js and npm (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Enter the project directory
cd valued-lives-platform-main

# Install dependencies
npm install

# Start the dev server
npm run dev
```

## Tech stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Development scripts

- `npm run dev` — start the local development server
- `npm run build` — create a production build
- `npm run preview` — preview the production build locally

## Deployment

1. Run `npm run build` to generate the production assets in `dist/`.
2. Deploy the contents of `dist/` to your hosting provider (e.g., Vercel, Netlify, S3 + CDN).
