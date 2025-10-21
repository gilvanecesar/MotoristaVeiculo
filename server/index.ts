import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerUserSubscriptionRoutes } from "./routes/user-subscription";
import { setupVite, serveStatic, log } from "./vite";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { setupOpenPixRoutes } from "./openpix-routes";

// Servidor Express
const app = express();

// Configurar CORS para desenvolvimento
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
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
  // Exibir informações de ambiente para debug
  log(`Iniciando servidor no ambiente: ${process.env.NODE_ENV || 'development'}`);
  log(`Diretório atual: ${process.cwd()}`);
  
  try {
    // Inicializar serviço de email
    import('./email-service').then(({ initEmailService }) => {
      initEmailService();
      log("Serviço de email inicializado com sucesso");
    }).catch(error => {
      console.error("Erro ao inicializar serviço de email:", error);
    });
    
    // Aplicar migrações do banco de dados
    log("Aplicando migrações do banco de dados...");
    await migrate(db, { migrationsFolder: "./migrations" });
    log("Migrações aplicadas com sucesso!");
  } catch (error) {
    console.error("Erro ao aplicar migrações:", error);
    console.error(error);
    process.exit(1);
  }
  
  // Configurar rotas da API
  const server = await registerRoutes(app);
  
  // Configurar rotas do OpenPix
  setupOpenPixRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`[ERROR] ${status} - ${message}`);
    console.error(err);
    
    // Em produção não enviamos detalhes do erro para o cliente
    if (process.env.NODE_ENV === 'production') {
      res.status(status).json({ 
        message: status === 500 ? "Erro interno do servidor" : message 
      });
    } else {
      // Em desenvolvimento enviamos mais detalhes para facilitar o debug
      res.status(status).json({ 
        message,
        stack: err.stack,
        details: err
      });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

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
