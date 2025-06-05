import express from 'express';
import { createServer } from 'http';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { GitLabService } from './services/gitlab.service';
import { AIEngine } from './services/ai-engine.service';

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const PORT = Number(process.env.PORT) || 4000;

  // Middleware básico
  app.use(cors());
  app.use(bodyParser.json());

  // IMPORTANTE: Definir rutas ANTES de Apollo
  app.get('/', (req, res) => {
    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol || 'http';
    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>GitLab AI DevOps Companion</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f23;
      color: #e1e1e1;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 800px;
      padding: 2rem;
      text-align: center;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      background: linear-gradient(45deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: #888;
      margin-bottom: 3rem;
      font-size: 1.2rem;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 1.5rem;
    }
    .endpoint {
      background: #1a1a2e;
      padding: 1rem;
      border-radius: 4px;
      font-family: monospace;
      margin: 1rem 0;
      word-break: break-all;
    }
    .status {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #10b981;
      color: white;
      border-radius: 999px;
      margin-bottom: 2rem;
    }
    a {
      color: #667eea;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>GitLab AI DevOps Companion</h1>
    <p class="subtitle">Intelligent CI/CD Pipeline Management API</p>
    <div class="status">✓ Operational</div>
    
    <div class="card">
      <h2>GraphQL API</h2>
      <div class="endpoint">${protocol}://${host}/graphql</div>
      <p>
        <a href="https://studio.apollographql.com/sandbox/explorer?endpoint=${encodeURIComponent(protocol + '://' + host + '/graphql')}" target="_blank">
          Open in Apollo Studio →
        </a>
      </p>
    </div>
    
    <div class="card">
      <h2>Health Check</h2>
      <div class="endpoint">GET ${protocol}://${host}/health</div>
    </div>
    
    <div class="card">
      <h2>Documentation</h2>
      <p>
        <a href="https://gitlab.com/Legoar97-group/gitlab-ai-devops-companion" target="_blank">
          View on GitLab →
        </a>
      </p>
    </div>
  </div>
</body>
</html>
    `);
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'gitlab-ai-devops-companion',
      version: '1.0.0'
    });
  });

  // Apollo Server con schema ejecutable
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  
  const server = new ApolloServer({
    schema,
    introspection: true,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer })
    ],
    formatError: (err) => {
      console.error(err);
      return err;
    }
  });

  await server.start();

  // GraphQL endpoint
  app.use('/graphql', bodyParser.json(), (req, res, next) => {
    const context = {
      gitlab: new GitLabService(),
      ai: new AIEngine(),
      user: req.headers.authorization || null
    };

    return server.createHandler({ 
      path: '/graphql',
      context: async () => context
    })(req, res, next);
  });

  // Iniciar servidor
  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, resolve);
  });

  console.log(`
    🚀 Server ready!
    📍 URL: http://localhost:${PORT}
    📊 GraphQL: http://localhost:${PORT}/graphql
  `);
}

startServer().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});