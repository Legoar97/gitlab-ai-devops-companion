# GitLab AI DevOps Companion 🚀

An intelligent AI assistant that revolutionizes DevOps workflows by combining natural language processing, predictive analytics, and automated execution for GitLab CI/CD pipelines.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)

## 🏆 Google Cloud + GitLab Hackathon 2025 Submission

This project is built for the **AI in Action: Multi-Partner Google Cloud Hackathon**.

### 🎯 Challenge Category: GitLab Challenge

**Objective**: Create an AI-enabled app using GitLab and Google Cloud that demonstrates building Software. Faster.

## ✨ Key Features

- 🗣️ **Natural Language Pipeline Control**: Control your GitLab CI/CD pipelines using simple commands like "deploy to staging"
- 🔮 **Predictive Resource Optimization**: AI-powered predictions reduce CI/CD costs by up to 60%
- 🚀 **Automated Pipeline Execution**: Execute complex DevOps tasks with voice commands
- 📊 **Real-time Cost Analysis**: Track and optimize your pipeline spending in real-time
- 🔧 **Self-healing Pipelines**: Automatically detect and fix common pipeline failures
- 🤖 **Powered by Gemini 2.0**: Leverages Google's latest AI model for superior performance

## 🎥 Demo Video

[Coming soon - hackathon submission video]

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **GraphQL**: Apollo Server 4
- **AI/ML**: Google Cloud Vertex AI, Gemini 2.0 Flash
- **GitLab Integration**: GraphQL API & Webhooks

### AI & Machine Learning
- **NLP**: Dialogflow CX for intent recognition
- **Predictions**: Vertex AI & BigQuery ML
- **Model**: Gemini 2.0 Flash (gemini-2.0-flash-001)

### Infrastructure
- **Hosting**: Google Cloud Run
- **Functions**: Cloud Functions for webhooks
- **Storage**: Cloud Storage for artifacts
- **Analytics**: BigQuery for pipeline analytics

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Google Cloud Account with billing enabled
- GitLab account with API access
- Windows/Mac/Linux development environment

### Installation

1. **Clone the repository**
   ```bash
   git clone https://gitlab.com/Legoar97-group/gitlab-ai-devops-companion.git
   cd gitlab-ai-devops-companion
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Configure Google Cloud**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

5. **Start the development server**
   ```bash
   # Windows
   npm run dev:windows
   
   # Mac/Linux
   npm run dev
   ```

6. **Access the GraphQL playground**
   ```
   http://localhost:4000/
   ```

## 📝 Configuration

Create a `.env` file in the backend directory:

```env
# Server
NODE_ENV=development
PORT=4000

# GitLab
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
GITLAB_WEBHOOK_SECRET=your_webhook_secret

# Google Cloud
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# AI Configuration
VERTEX_AI_MODEL=gemini-2.0-flash-001
```

## 🔍 Usage Examples

### Natural Language Commands

```graphql
mutation {
  processCommand(
    command: "deploy feature-auth to staging"
    context: "my-project"
  ) {
    intent
    action
    message
    executed
  }
}
```

### Resource Prediction

```graphql
query {
  predictResources(
    projectPath: "my-project"
    branch: "feature/new-feature"
  ) {
    cpu
    memory
    estimatedDuration
    estimatedCost
    confidence
  }
}
```

## 🧩 GitLab CI/CD Component

This project includes a reusable CI/CD component for the GitLab Catalog.

### Integration

Add to your `.gitlab-ci.yml`:

```yaml
include:
  - component: gitlab.com/Legoar97-group/gitlab-ai-devops-companion/ai-devops-optimizer@~latest
    inputs:
      optimize_for: balanced
```

## 📊 API Documentation

### GraphQL Endpoints

- **Endpoint**: `/graphql`
- **Playground**: Available at root URL in development

### Key Queries & Mutations

| Type | Name | Description |
|------|------|-------------|
| Query | `predictResources` | Get resource predictions for a pipeline |
| Query | `getOptimizations` | Get cost optimization recommendations |
| Mutation | `processCommand` | Process natural language commands |
| Mutation | `executePipeline` | Trigger pipeline with AI optimization |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Merge Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Ivan Pinzon** - Full Stack Developer - [@Legoar97](https://gitlab.com/Legoar97)

## 🙏 Acknowledgments

- Google Cloud team for the amazing AI tools
- GitLab for the comprehensive API
- Hackathon organizers and mentors

## 📞 Support

- Create an issue in the repository
- Contact via GitLab: [@Legoar97-group](https://gitlab.com/Legoar97-group)

---

Built with ❤️ for the Google Cloud + GitLab Hackathon 2025