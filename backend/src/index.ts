import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { GitLabService } from './services/gitlab.service';
import { AIEngine } from './services/ai-engine.service';

// Cargar variables de entorno
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 4000;

  // Crear el servidor Apollo
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  });

  // Iniciar Apollo Server
  await server.start();

  // Landing page ANTES de otros middlewares
  app.get('/', (req, res) => {
    const serviceUrl = `${req.protocol}://${req.get('host')}`;
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GitLab AI DevOps Companion API</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #e0e0e0;
            min-height: 100vh;
            line-height: 1.6;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }

          header {
            text-align: center;
            padding: 4rem 0 3rem;
            position: relative;
          }

          .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          }

          .logo svg {
            width: 50px;
            height: 50px;
            fill: white;
          }

          h1 {
            font-size: 3rem;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
          }

          .subtitle {
            font-size: 1.25rem;
            color: #9ca3af;
            font-weight: 300;
          }

          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10b981;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            margin-top: 2rem;
          }

          .status-indicator {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-top: 4rem;
          }

          .card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 2rem;
            transition: all 0.3s ease;
          }

          .card:hover {
            transform: translateY(-5px);
            border-color: rgba(102, 126, 234, 0.3);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }

          .card-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .card-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .card-icon svg {
            width: 24px;
            height: 24px;
            fill: white;
          }

          .card h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #f3f4f6;
          }

          .card p {
            color: #9ca3af;
            margin-bottom: 1.5rem;
          }

          .code-block {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1rem;
            overflow-x: auto;
            font-family: 'Fira Code', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
          }

          .code-block code {
            color: #e9d5ff;
          }

          .endpoint-url {
            background: rgba(102, 126, 234, 0.1);
            border: 1px solid rgba(102, 126, 234, 0.3);
            color: #a78bfa;
            padding: 0.25rem 0.75rem;
            border-radius: 6px;
            font-family: 'Fira Code', monospace;
            font-size: 0.875rem;
            word-break: break-all;
          }

          .links {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
          }

          .link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #a78bfa;
            text-decoration: none;
            font-size: 0.875rem;
            transition: color 0.2s;
          }

          .link:hover {
            color: #c4b5fd;
          }

          .link svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
          }

          .feature-list {
            list-style: none;
            margin-top: 1rem;
          }

          .feature-list li {
            padding: 0.5rem 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: #d1d5db;
          }

          .feature-list svg {
            width: 16px;
            height: 16px;
            fill: #10b981;
            flex-shrink: 0;
          }

          footer {
            text-align: center;
            margin-top: 6rem;
            padding: 2rem 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: #6b7280;
            font-size: 0.875rem;
          }

          @media (max-width: 768px) {
            h1 {
              font-size: 2rem;
            }
            .grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <div class="logo">
              <svg viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            <h1>GitLab AI DevOps Companion</h1>
            <p class="subtitle">Intelligent CI/CD Pipeline Management API</p>
            <div class="status-badge">
              <div class="status-indicator"></div>
              <span>Operational</span>
            </div>
          </header>

          <div class="grid">
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3>Health Check</h3>
              </div>
              <p>Verify service status and availability</p>
              <div class="code-block">
                <code>GET ${serviceUrl}/health</code>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3>GraphQL API</h3>
              </div>
              <p>Main API endpoint for all operations</p>
              <div class="endpoint-url">${serviceUrl}/graphql</div>
              <ul class="feature-list">
                <li>
                  <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  Natural language command processing
                </li>
                <li>
                  <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  Pipeline resource predictions
                </li>
                <li>
                  <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  Cost optimization analysis
                </li>
                <li>
                  <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  Automated pipeline execution
                </li>
              </ul>
            </div>

            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                  </svg>
                </div>
                <h3>Example Request</h3>
              </div>
              <p>Process a natural language command</p>
              <div class="code-block">
                <code>curl -X POST ${serviceUrl}/graphql \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "mutation {
      processCommand(
        command: \\"deploy to production\\"
        context: \\"my-project\\"
      ) {
        intent
        action
        message
        executed
      }
    }"
  }'</code>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                </div>
                <h3>Documentation</h3>
              </div>
              <p>Explore the complete API documentation and integration guides</p>
              <div class="links">
                <a href="https://gitlab.com/Legoar97-group/gitlab-ai-devops-companion" class="link" target="_blank">
                  <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  GitLab Repository
                </a>
                <a href="https://studio.apollographql.com/sandbox/explorer?endpoint=${encodeURIComponent(serviceUrl + '/graphql')}" class="link" target="_blank">
                  <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  Apollo Studio
                </a>
              </div>
            </div>
          </div>

          <footer>
            <p>Built for Google Cloud + GitLab Hackathon 2025</p>
          </footer>
        </div>
      </body>
      </html>
    `);
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'gitlab-ai-devops-companion',
      version: '1.0.0'
    });
  });

  // Aplicar middlewares DESPUÉS de las rutas GET
  app.use(cors());
  app.use(bodyParser.json());

  // GraphQL endpoint - usar la sintaxis correcta
  // @ts-ignore
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }: any) => ({
        gitlab: new GitLabService(),
        ai: new AIEngine(),
        user: req.headers.authorization || null
      })
    })
  );

  // Iniciar servidor
  app.listen(PORT, () => {
    console.log(`
      🚀 GitLab AI DevOps Companion started successfully!
      📍 Server running at: http://localhost:${PORT}
      📊 GraphQL endpoint: http://localhost:${PORT}/graphql
      🖥️  Platform: ${process.platform}
      📅 Date: ${new Date().toLocaleDateString()}
    `);
  });
}

// Iniciar
startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});