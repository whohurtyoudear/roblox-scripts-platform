import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// For our Replit development environment, override the NODE_ENV detection
// to prevent production mode from triggering in the development environment
// This is needed because Replit IDs are present in both dev and production
if (process.env.REPL_SLUG || process.env.REPL_ID) {
  // Only use development mode for our current work
  process.env.NODE_ENV = 'development';
  console.log('Detected Replit environment, using development mode for now');
}

// Log environment information for debugging
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Database: ${process.env.DATABASE_URL ? 'Available (from DATABASE_URL)' : 'Not available from URL'}`);
console.log(`PostgreSQL Environment Variables: ${
  process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE 
  ? 'Available (from PG* vars)' 
  : 'Not all available'
}`);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers for development
app.use((req, res, next) => {
  // Set proper API response headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register API routes FIRST to ensure they have priority
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Explicitly avoid the catch-all Vite route for API endpoints
  app.use('/api', (req, res) => {
    // If we get here, no API route was matched
    res.status(404).json({ message: 'API endpoint not found' });
  });

  // Always use Vite for development in our current Replit environment
  // This is a temporary fix until we properly build the client for production
  console.log(`Using Vite for development (env: ${app.get("env")})`);
  await setupVite(app, server);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
