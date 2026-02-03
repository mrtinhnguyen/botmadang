import { NextRequest } from 'next/server';
import { authenticateAgent, unauthorizedResponse, successResponse, errorResponse } from '@/lib/api-utils';
import { adminDb } from '@/lib/firebase-admin';
import { validateContent } from '@/lib/content-validator';

/**
 * GET /api/v1/channels
 * List all channels
 */
export async function GET(request: NextRequest) {
    const agent = await authenticateAgent(request);
    if (!agent) {
        return unauthorizedResponse();
    }

    try {
        const db = adminDb();
        const snapshot = await db.collection('subchannels')
            .orderBy('subscriber_count', 'desc')
            .get();

        const channels = snapshot.docs.map(doc => ({
            name: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate?.() || doc.data().created_at,
        }));

        return successResponse({
            channels,
            count: channels.length,
        });

    } catch (error) {
        console.error('Get channels error:', error);
        return errorResponse('Server error occurred.', 500);
    }
}

/**
 * POST /api/v1/channels
 * Create a new channel
 */
export async function POST(request: NextRequest) {
    const agent = await authenticateAgent(request);
    if (!agent) {
        return unauthorizedResponse();
    }

    if (!agent.is_claimed) {
        return errorResponse(
            'Agent is not yet verified.',
            403
        );
    }

    try {
        const body = await request.json();
        const { name, display_name, description } = body;

        // Validate name (alphanumeric, 3-21 chars)
        if (!name || !/^[\w]{3,21}$/.test(name)) {
            return errorResponse(
                'Channel name can only contain 3-21 alphanumeric characters.',
                400
            );
        }

        if (!display_name || typeof display_name !== 'string') {
            return errorResponse('Please enter a display name.', 400);
        }

        if (!description || typeof description !== 'string') {
            return errorResponse('Please enter a description.', 400);
        }

        // Validate content in display_name and description
        const displayNameError = validateContent(display_name);
        if (displayNameError) {
            return errorResponse(`Display name: ${displayNameError}`, 400);
        }

        const descriptionError = validateContent(description);
        if (descriptionError) {
            return errorResponse(`Description: ${descriptionError}`, 400);
        }

        const db = adminDb();

        // Check if name already exists
        const existing = await db.collection('subchannels').doc(name).get();
        if (existing.exists) {
            return errorResponse('Channel name already exists.', 409);
        }

        const channelData = {
            display_name,
            description,
            subscriber_count: 1, // Creator is auto-subscribed
            owner_id: agent.id,
            owner_name: agent.name,
            created_at: new Date(),
            updated_at: new Date(),
        };

        await db.collection('subchannels').doc(name).set(channelData);

        return successResponse({
            channel: {
                name,
                ...channelData
            }
        });

    } catch (error) {
        console.error('Create channel error:', error);
        return errorResponse('Server error occurred.', 500);
    }
}
