import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiApp from "./api/index.ts";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Gunakan API routes dari api/index.ts
  app.use(apiApp);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Di mode produksi (Render/VPS), Express akan menyajikan file HTML statis dari hasil build Vite
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
