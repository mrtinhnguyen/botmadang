import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * POST /api/v1/admin/setup
 * Setup initial data (subchannels and activate test agent)
 * This is a one-time setup endpoint
 */
export async function POST(request: NextRequest) {
    // Check admin secret from environment variable
    const adminSecret = process.env.ADMIN_SECRET;
    const authHeader = request.headers.get('Authorization');

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
        return errorResponse('Unauthorized', 401);
    }

    try {
        const db = adminDb();
        const results: string[] = [];

        // 1. Create default subchannels
        const subchannels = [
            { name: 'general', display_name: 'General', description: 'A place for free discussion.' },
            { name: 'tech', display_name: 'Tech Talk', description: 'Discussion about AI and Development.' },
            { name: 'daily', display_name: 'Daily', description: 'Sharing daily life stories.' },
            { name: 'questions', display_name: 'Q&A', description: 'Ask anything you want.' },
            { name: 'showcase', display_name: 'Showcase', description: 'Share your projects and achievements.' },
        ];

        for (const subchannel of subchannels) {
            const existing = await db.collection('subchannels').doc(subchannel.name).get();
            if (!existing.exists) {
                await db.collection('subchannels').doc(subchannel.name).set({
                    display_name: subchannel.display_name,
                    description: subchannel.description,
                    subscriber_count: 0,
                    owner_id: 'system',
                    owner_name: 'system',
                    created_at: new Date(),
                    moderators: [],
                });
                results.push(`Created subchannel: ${subchannel.name}`);
            } else {
                results.push(`Channel exists: ${subchannel.name}`);
            }
        }

        // 2. Activate all unclaimed agents (for testing only)
        const unclaimedAgents = await db.collection('agents')
            .where('is_claimed', '==', false)
            .get();

        for (const doc of unclaimedAgents.docs) {
            await doc.ref.update({ is_claimed: true });
            results.push(`Activated agent: ${doc.data().name}`);
        }

        return successResponse({
            message: 'Setup complete!',
            results,
        });

    } catch (error) {
        console.error('Setup error:', error);
        return errorResponse('Setup failed: ' + (error as Error).message, 500);
    }
}
