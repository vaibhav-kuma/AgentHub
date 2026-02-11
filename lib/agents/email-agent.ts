import { Resend } from "resend";
import Anthropic from "@anthropic-ai/sdk";

const resend = new Resend(process.env.RESEND_API_KEY);
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface EmailProspect {
    email: string;
    name: string;
    company?: string;
    title?: string;
    linkedinUrl?: string;
}

interface EmailCampaignConfig {
    fromEmail: string;
    fromName: string;
    subject: string;
    prospects: EmailProspect[];
    knowledgeBase: string[];
    agentConfig: {
        goal?: string;
        tone?: string;
        icpTitle?: string;
        icpIndustry?: string;
    };
}

export class ColdEmailAgent {
    private instantlyApiKey?: string;

    constructor(instantlyApiKey?: string) {
        this.instantlyApiKey = instantlyApiKey;
    }

    /**
     * Generate personalized email content using Claude
     */
    async generateEmail(
        prospect: EmailProspect,
        knowledgeBase: string[],
        agentConfig: any
    ): Promise<{ subject: string; body: string }> {
        const context = knowledgeBase.join("\n\n");

        const prompt = `You are a sales professional writing a personalized cold email.

Prospect Information:
- Name: ${prospect.name}
- Email: ${prospect.email}
- Company: ${prospect.company || "Unknown"}
- Title: ${prospect.title || "Unknown"}

Company/Product Context:
${context}

Agent Configuration:
- Goal: ${agentConfig.goal || "Generate interest"}
- Tone: ${agentConfig.tone || "professional"}
- ICP: ${agentConfig.icpTitle || "N/A"} at ${agentConfig.icpIndustry || "N/A"}

Write a personalized cold email that:
1. Has a compelling subject line (max 50 characters)
2. Opens with a personalized hook
3. Clearly states the value proposition
4. Includes a soft call-to-action
5. Is concise (max 150 words)
6. Sounds natural and conversational

Format your response as:
SUBJECT: [subject line]
BODY: [email body]`;

        try {
            const response = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1000,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            });

            const content =
                response.content[0].type === "text" ? response.content[0].text : "";

            // Parse subject and body
            const subjectMatch = content.match(/SUBJECT:\s*(.+)/);
            const bodyMatch = content.match(/BODY:\s*([\s\S]+)/);

            const subject = subjectMatch
                ? subjectMatch[1].trim()
                : `Quick question, ${prospect.name.split(" ")[0]}`;
            const body = bodyMatch
                ? bodyMatch[1].trim()
                : `Hi ${prospect.name.split(" ")[0]},\n\nI came across your profile and thought you might be interested in what we're building.\n\nWould love to connect!`;

            return { subject, body };
        } catch (error) {
            console.error("Error generating email:", error);
            return {
                subject: `Quick question, ${prospect.name.split(" ")[0]}`,
                body: `Hi ${prospect.name.split(" ")[0]},\n\nI came across your profile and thought you might be interested in what we're building.\n\nWould love to connect!`,
            };
        }
    }

    /**
     * Send email via Resend
     */
    async sendEmail(
        to: string,
        subject: string,
        body: string,
        fromEmail: string,
        fromName: string
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const { data, error } = await resend.emails.send({
                from: `${fromName} <${fromEmail}>`,
                to: [to],
                subject,
                html: body.replace(/\n/g, "<br>"),
                text: body,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, messageId: data?.id };
        } catch (error: any) {
            console.error("Error sending email:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add email to Instantly.ai for warm-up
     */
    async addToInstantlyWarmup(email: string): Promise<boolean> {
        if (!this.instantlyApiKey) {
            console.warn("Instantly.ai API key not configured");
            return false;
        }

        try {
            const response = await fetch("https://api.instantly.ai/api/v1/account/warmup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.instantlyApiKey}`,
                },
                body: JSON.stringify({
                    email,
                    warmup_enabled: true,
                    daily_rampup: 5,
                    reply_rate: 30,
                }),
            });

            if (!response.ok) {
                throw new Error(`Instantly.ai API error: ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error("Error adding to Instantly warmup:", error);
            return false;
        }
    }

    /**
     * Run email campaign
     */
    async runCampaign(
        config: EmailCampaignConfig
    ): Promise<Array<{ prospect: EmailProspect; success: boolean; error?: string }>> {
        const results: Array<{
            prospect: EmailProspect;
            success: boolean;
            error?: string;
        }> = [];

        for (const prospect of config.prospects) {
            try {
                // Generate personalized email
                const { subject, body } = await this.generateEmail(
                    prospect,
                    config.knowledgeBase,
                    config.agentConfig
                );

                // Send email
                const result = await this.sendEmail(
                    prospect.email,
                    subject,
                    body,
                    config.fromEmail,
                    config.fromName
                );

                results.push({
                    prospect,
                    success: result.success,
                    error: result.error,
                });

                // Random delay between emails (30-60 seconds)
                if (config.prospects.indexOf(prospect) < config.prospects.length - 1) {
                    await this.delay(30000, 60000);
                }
            } catch (error: any) {
                results.push({
                    prospect,
                    success: false,
                    error: error.message,
                });
            }
        }

        return results;
    }

    /**
     * Random delay helper
     */
    private async delay(min: number, max: number): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
}
