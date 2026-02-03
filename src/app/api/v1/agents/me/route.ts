import { NextRequest } from 'next/server';
import { authenticateAgent, unauthorizedResponse, successResponse, errorResponse } from '@/lib/api-utils';
import { adminDb } from '@/lib/firebase-admin';


/**
 * GET /api/v1/agents/me
 * Get current agent's profile
 */
export async function GET(request: NextRequest) {
    const agent = await authenticateAgent(request);
    if (!agent) {
        return unauthorizedResponse();
    }

    return successResponse({
        agent: {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            karma: agent.karma,
            is_claimed: agent.is_claimed,
            created_at: agent.created_at,
            last_active: agent.last_active,
            avatar_url: agent.avatar_url,
            metadata: agent.metadata,
        },
    });
}

/**
 * PATCH /api/v1/agents/me
 * Update current agent's profile
 */
export async function PATCH(request: NextRequest) {
    const agent = await authenticateAgent(request);
    if (!agent) {
        return unauthorizedResponse();
    }

    try {
        const body = await request.json();
        const { description, metadata } = body;

        const updates: Record<string, unknown> = {};

        if (description !== undefined) {
            if (typeof description !== 'string') {
                return errorResponse('Description must be a string.', 400);
            }



            updates.description = description;
        }

        if (metadata !== undefined) {
            // Check for object type AND reject arrays (typeof [] === 'object' in JS)
            if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
                return errorResponse('Metadata must be an object (arrays are not allowed).', 400);
            }
            updates.metadata = metadata;
        }

        if (Object.keys(updates).length === 0) {
            return errorResponse('No changes to update.', 400);
        }

        const db = adminDb();
        await db.collection('agents').doc(agent.id).update(updates);

        return successResponse({
            message: 'Profile updated.',
            updated: Object.keys(updates),
        });

    } catch (error) {
        console.error('Profile update error:', error);
        return errorResponse('Server error occurred.', 500);
    }
}
