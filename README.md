# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Runtime API URL config (config.js)

To allow changing API URL at runtime (e.g. for ngrok or dynamic backend), use the following approach:

1. Create a file `public/config.js` with:

```js
window.RUNTIME_CONFIG = {
  API_BASE_URL: "http://localhost:8000"
};
```

2. In `src/services/Api.jsx`, API URL is read from `window.RUNTIME_CONFIG.API_BASE_URL` if available.

3. When running with Docker/nginx, mount a host file (e.g. `runtime-config/config.js`) to `/usr/share/nginx/html/config.js` in the container:

```yaml
volumes:
  - ./runtime-config/config.js:/usr/share/nginx/html/config.js:ro
```

4. Update `runtime-config/config.js` whenever your backend URL changes (e.g. new ngrok URL) and restart the frontend container.

This allows you to change the backend API URL without rebuilding the frontend image.
