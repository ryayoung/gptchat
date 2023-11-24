# Svelte Client

```bash
# install dependencies
npm install

# start the server
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open

# Build for prod
npm run build
```

## File Structure: How does it work?

This will look confusing at first because SvelteKit is designed to have server-side code and client-side code both running.
Our app, however, is **static**. The final bundle is a set of static files, which the Flask backend will send to the browser just once, when the website is visited.

### All of the app code is in `/lib`

A sveltekit app technically starts with `/routes/+page.svelte`. In ours, we just import `lib/App.svelte`, and render it.

The `/lib` directory is our flexible working space, in which file names and file paths don't have any special meaning.
