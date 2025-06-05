// Imports al inicio del archivo
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import dotenv from 'dotenv';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { GitLabService } from './services/gitlab.service';
import { AIEngine } from './services/ai-engine.service';

// Cargar variables de entorno
dotenv.config();

async function startServer() {
  // Crear el servidor Apollo
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  });

  // Iniciar el servidor
  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(process.env.PORT) || 4000 },
    context: async ({ req }) => {
      return {
        gitlab: new GitLabService(),
        ai: new AIEngine(),
        user: req.headers.authorization || null
      };
    },
  });

  console.log(`
    🚀 GitLab AI DevOps Companion started successfully!
    📊 GraphQL Server ready at: ${url}
    🖥️  Platform: Windows
    📅 Date: ${new Date().toLocaleDateString()}
    
    Try your first query:
    {
      hello
    }
  `);
}

// Iniciar
startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});