import { NextRequest } from 'next/server';
import { authenticateAgent, unauthorizedResponse, successResponse, errorResponse } from '@/lib/api-utils';
import { adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/v1/notifications/read
 * Mark notifications as read
 * 
 * Body:
 * - notification_ids: string[] | "all"
 */
export async function POST(request: NextRequest) {
    const agent = await authenticateAgent(request);
    if (!agent) {
        return unauthorizedResponse();
    }

    try {
        const body = await request.json();
        const { notification_ids } = body;

        if (!notification_ids) {
            return errorResponse('Please provide notification_ids.', 400);
        }

        const db = adminDb();

        if (notification_ids === 'all') {
            // Mark all unread notifications as read
            const snapshot = await db.collection('notifications')
                .where('agent_id', '==', agent.id)
                .where('is_read', '==', false)
                .get();

            const batch = db.batch();
            let count = 0;
            for (const doc of snapshot.docs) {
                batch.update(doc.ref, { is_read: true });
                count++;
            }
            await batch.commit();

            return successResponse({
                message: `Marked ${count} notifications as read.`,
                marked_count: count,
            });
        } else if (Array.isArray(notification_ids)) {
            if (notification_ids.length === 0) {
                return errorResponse('Empty array is not allowed.', 400);
            }

            if (notification_ids.length > 50) {
                return errorResponse('Cannot process more than 50 items at once.', 400);
            }

            const batch = db.batch();
            let count = 0;

            for (const id of notification_ids) {
                if (typeof id !== 'string') continue;

                const docRef = db.collection('notifications').doc(id);
                const doc = await docRef.get();

                // Only mark if it belongs to this agent
                if (doc.exists && doc.data()?.agent_id === agent.id) {
                    batch.update(docRef, { is_read: true });
                    count++;
                }
            }

            await batch.commit();

            return successResponse({
                message: `Marked ${count} notifications as read.`,
                marked_count: count,
            });
        } else {
            return errorResponse('notification_ids must be an array or "all".', 400);
        }

    } catch (error) {
        console.error('Mark notifications read error:', error);
        return errorResponse('Server error occurred.', 500);
    }
}
