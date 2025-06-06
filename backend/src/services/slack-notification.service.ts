// backend/src/services/slack-notification.service.ts
import axios from 'axios';

interface SlackMessage {
  text: string;
  blocks?: any[];
  attachments?: any[];
}

export class SlackNotificationService {
  private webhookUrl: string;
  private enabled: boolean;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    this.enabled = !!this.webhookUrl;
  }

  private async sendMessage(message: SlackMessage) {
    if (!this.enabled) {
      console.log('Slack notifications disabled - no webhook URL');
      return;
    }

    try {
      await axios.post(this.webhookUrl, message);
    } catch (error) {
      console.error('Error sending Slack message:', error);
    }
  }

  async sendPipelineFailureAlert(data: {
    projectName: string;
    pipelineId: string;
    pipelineUrl: string;
    failureReason: string;
    user: string;
    ref: string;
  }) {
    const message: SlackMessage = {
      text: `Pipeline Failed in ${data.projectName}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Pipeline Failure Alert',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Project:*\n${data.projectName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Branch:*\n${data.ref}`,
            },
            {
              type: 'mrkdwn',
              text: `*Triggered by:*\n${data.user}`,
            },
            {
              type: 'mrkdwn',
              text: `*Pipeline:*\n<${data.pipelineUrl}|#${data.pipelineId}>`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Failure Reason:*\n\`\`\`${data.failureReason}\`\`\``,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Pipeline',
                emoji: true,
              },
              url: data.pipelineUrl,
              style: 'danger',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Retry Pipeline',
                emoji: true,
              },
              value: `retry_${data.pipelineId}`,
              action_id: 'retry_pipeline',
            },
          ],
        },
      ],
    };

    await this.sendMessage(message);
  }

  async sendDeploymentSuccessNotification(data: {
    projectName: string;
    environment: string;
    version: string;
    deployedBy: string;
    duration: number;
  }) {
    const message: SlackMessage = {
      text: `Deployment Successful to ${data.environment}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '✅ Deployment Successful',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Project:*\n${data.projectName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Environment:*\n${data.environment}`,
            },
            {
              type: 'mrkdwn',
              text: `*Version:*\n${data.version}`,
            },
            {
              type: 'mrkdwn',
              text: `*Deployed by:*\n${data.deployedBy}`,
            },
            {
              type: 'mrkdwn',
              text: `*Duration:*\n${data.duration} minutes`,
            },
          ],
        },
      ],
    };

    await this.sendMessage(message);
  }

  async sendHighRiskPipelineAlert(data: {
    projectName: string;
    pipelineId: string;
    failureProbability: number;
    predictedDuration: number;
    riskFactors: string[];
  }) {
    const riskLevel = data.failureProbability > 0.8 ? 'Critical' : 'High';
    const emoji = data.failureProbability > 0.8 ? '🔴' : '🟠';

    const message: SlackMessage = {
      text: `High Risk Pipeline Detected`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${riskLevel} Risk Pipeline`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `AI has detected a high risk of failure for pipeline *#${data.pipelineId}* in *${data.projectName}*`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Failure Probability:*\n${(data.failureProbability * 100).toFixed(0)}%`,
            },
            {
              type: 'mrkdwn',
              text: `*Predicted Duration:*\n${Math.round(data.predictedDuration / 60)} minutes`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Risk Factors:*\n${data.riskFactors.map(f => `• ${f}`).join('\n')}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Cancel Pipeline',
                emoji: true,
              },
              style: 'danger',
              value: `cancel_${data.pipelineId}`,
              action_id: 'cancel_pipeline',
              confirm: {
                title: {
                  type: 'plain_text',
                  text: 'Cancel Pipeline?',
                },
                text: {
                  type: 'mrkdwn',
                  text: 'Are you sure you want to cancel this pipeline?',
                },
                confirm: {
                  type: 'plain_text',
                  text: 'Cancel Pipeline',
                },
                deny: {
                  type: 'plain_text',
                  text: 'Keep Running',
                },
              },
            },
          ],
        },
      ],
    };

    await this.sendMessage(message);
  }

  async sendCostAlert(data: {
    projectName: string;
    currentMonthCost: number;
    projectedMonthCost: number;
    increase: number;
    recommendations: string[];
  }) {
    const message: SlackMessage = {
      text: `Cost Alert for ${data.projectName}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '💰 Pipeline Cost Alert',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Pipeline costs for *${data.projectName}* are ${data.increase}% higher than last month.`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Current Month:*\n$${data.currentMonthCost.toFixed(2)}`,
            },
            {
              type: 'mrkdwn',
              text: `*Projected Total:*\n$${data.projectedMonthCost.toFixed(2)}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Cost Optimization Recommendations:*\n${data.recommendations.map(r => `• ${r}`).join('\n')}`,
          },
        },
      ],
    };

    await this.sendMessage(message);
  }

  async sendOptimalDeploymentWindow(data: {
    projectName: string;
    suggestedTime: string;
    reason: string;
    successRate: number;
  }) {
    const message: SlackMessage = {
      text: `Optimal Deployment Window Available`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎯 Optimal Deployment Window',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Great time to deploy *${data.projectName}*!`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Suggested Time:*\n${data.suggestedTime}`,
            },
            {
              type: 'mrkdwn',
              text: `*Historical Success Rate:*\n${data.successRate}%`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Reason:*\n${data.reason}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Deploy Now',
                emoji: true,
              },
              style: 'primary',
              value: 'deploy_now',
              action_id: 'deploy_now',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Schedule for Later',
                emoji: true,
              },
              value: 'schedule_later',
              action_id: 'schedule_later',
            },
          ],
        },
      ],
    };

    await this.sendMessage(message);
  }
}