import { db } from "../db";
import { canvasEdges, canvasNodes, prospects } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { getCronRunner as getLinkedInRunner } from "../cron/linkedin-cron";
import { getEmailRunner } from "../cron/email-cron";
import { getTwitterRunner } from "../cron/twitter-cron";
import { getInstagramRunner } from "../cron/instagram-cron";

export class WorkflowService {
    /**
     * Trigger the next node in the workflow based on an event
     */
    static async triggerNext(sourceNodeId: string, userId: string, eventType: string, context: any): Promise<void> {
        try {
            console.log(`Workflow Trigger: Node ${sourceNodeId} event ${eventType}`);

            // 1. Find all edges originating from this node
            const edges = await db
                .select()
                .from(canvasEdges)
                .where(
                    and(
                        eq(canvasEdges.sourceNodeId, sourceNodeId),
                        eq(canvasEdges.userId, userId)
                    )
                );

            if (edges.length === 0) {
                console.log("No downstream nodes found for this workflow.");
                return;
            }

            // 2. Filter edges based on trigger condition (if any)
            for (const edge of edges) {
                const condition = edge.metadata?.triggerCondition;

                if (condition && condition !== eventType && condition !== 'any') {
                    continue;
                }

                // 3. Find the target node
                const [targetNode] = await db
                    .select()
                    .from(canvasNodes)
                    .where(eq(canvasNodes.id, edge.targetNodeId));

                if (!targetNode || !targetNode.isActive) continue;

                console.log(`Triggering target node: ${targetNode.id} (${targetNode.agentType})`);

                // 4. Handle handover based on agent type
                await this.executeNodeHandover(targetNode, context);
            }
        } catch (error) {
            console.error("Workflow trigger error:", error);
        }
    }

    /**
     * Logic for passing data/task to the next agent
     */
    private static async executeNodeHandover(node: any, context: any): Promise<void> {
        // Depending on the target node type, we might want to:
        // - Update a prospect status
        // - Add a job to a queue
        // - Immediately trigger an action

        const { prospectId, lastMessage } = context;

        if (prospectId) {
            // Update prospect's current assigned agent
            await db.update(prospects)
                .set({
                    status: 'engaged',
                    metadata: {
                        ...(context.metadata || {}),
                        assignedAgentId: node.id,
                        lastTriggerEvent: context.eventType
                    }
                })
                .where(eq(prospects.id, prospectId));
        }

        // For now, most agents are cron-based. 
        // We can force a sync to ensure the runner knows about the active agents.
        // In a more advanced version, we would have a 'task_queue' table.

        switch (node.agentType) {
            case "SDR": // LinkedIn
                await getLinkedInRunner().syncJob(node.id);
                break;
            case "Email SDR":
                await getEmailRunner().syncJob(node.id);
                break;
            case "Twitter Agent":
                await getTwitterRunner().syncJob(node.id);
                break;
            case "Instagram Agent":
                await getInstagramRunner().syncJob(node.id);
                break;
        }
    }
}
