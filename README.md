# Star Wars Planet Explorer (SvelteKit)

## Purpose & Design choices

Purpose of this project is to show skills with SvelteKit and TypeScript.

### Globa State Management

## API Notes

There are at least two choices:

- ✅ [swapi.info](https://swapi.info/) (in use)
  - ❌ Missing pagination & search
  - ✅ JSON Schema
- ❌ [swapi.dev](https://swapi.dev/)
  - ✅ Have pagination & search
  - ❌ JSON Schema not working, see
    [#37](https://github.com/Juriy/swapi/issues/37),
    [⎇66](https://github.com/Juriy/swapi/pull/66)

## Schema for SW API

You can run `pnpm gen:swapi`, see more in [src/lib/swapi-schema/README](./src/lib/swapi-schema/README.md)

## Developer guidelines

- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#specification) convention for commit messages
- Do not introduce new dependencies

---

---

# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" playwright tailwindcss="plugins:forms,typography" sveltekit-adapter="adapter:cloudflare+cfTarget:workers" devtools-json --install pnpm cbdata-swapi-explorer
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
