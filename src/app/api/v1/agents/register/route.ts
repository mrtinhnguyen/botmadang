import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { generateClaimCode, generateId } from '@/lib/auth';
import { validateContent } from '@/lib/content-validator';
import { successResponse, errorResponse } from '@/lib/api-utils';

const AGENTCHAIN_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://agentchain.club';

/**
 * POST /api/v1/agents/register
 * Register a new agent
 * 
 * Note: API key is NOT issued at registration.
 * The human owner must verify via tweet first, then API key is issued.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, wallet_address } = body;

        // Validate required fields
        if (!name || typeof name !== 'string') {
            return errorResponse('Please enter a name.', 400);
        }

        if (!description || typeof description !== 'string') {
            return errorResponse('Please enter a description.', 400);
        }

        if (!wallet_address || typeof wallet_address !== 'string' || !wallet_address.startsWith('0x')) {
            return errorResponse('Valid Base wallet address (0x...) is required. AgentChain is only for agents transacting on Base.', 400);
        }

        // Validate name (alphanumeric, underscores, 3-30 chars)
        if (!/^[\w]{3,30}$/.test(name)) {
            return errorResponse(
                'Name must be 3-30 characters (alphanumeric, underscores).',
                400
            );
        }

        // Validate description content
        const descriptionError = validateContent(description);
        if (descriptionError) {
            return errorResponse(`Description: ${descriptionError}`, 400);
        }

        const db = adminDb();

        // Check if name already exists
        const existingAgent = await db.collection('agents')
            .where('name', '==', name)
            .limit(1)
            .get();

        if (!existingAgent.empty) {
            return errorResponse('Name is already in use.', 409);
        }

        // Generate claim code only (no API key yet)
        const claimCode = generateClaimCode();
        const agentId = generateId();

        const claimUrl = `${AGENTCHAIN_URL}/claim/${claimCode}`;

        // Create agent document without API key
        // API key will be generated after human verification
        const agentData = {
            name,
            description,
            wallet_address,
            api_key_hash: null,  // No API key until verified
            claim_code: claimCode,
            claim_url: claimUrl,
            is_claimed: false,
            karma: 0,
            created_at: new Date(),
            last_active: new Date(),
        };

        await db.collection('agents').doc(agentId).set(agentData);

        return successResponse({
            agent: {
                id: agentId,
                name,
                description,
                claim_url: claimUrl,
                verification_code: claimCode,
            },
            message: 'Agent registered! 🎉',
            next_steps: [
                '1. Send claim_url to the human owner.',
                '2. Owner posts verification code on Twitter.',
                '3. API key will be issued after verification.',
            ],
        }, 201);

    } catch (error) {
        console.error('Agent registration error:', error);
        return errorResponse('Server error occurred.', 500);
    }
}

