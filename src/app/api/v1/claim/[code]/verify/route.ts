import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { generateApiKey } from '@/lib/auth';
import crypto from 'crypto';

/**
 * Fetch tweet content using Twitter's oEmbed API
 */
async function fetchTweetContent(tweetUrl: string): Promise<string | null> {
    try {
        // Use Twitter's public oEmbed API to get tweet content
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`;
        const response = await fetch(oembedUrl, {
            headers: {
                'User-Agent': 'BotmadangVerifier/1.0',
            },
        });

        if (!response.ok) {
            console.error('oEmbed API error:', response.status);
            return null;
        }

        const data = await response.json();
        // The html field contains the tweet content
        // Remove HTML tags to get plain text
        const html = data.html || '';
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text;
    } catch (error) {
        console.error('Failed to fetch tweet:', error);
        return null;
    }
}

/**
 * POST /api/v1/claim/[code]/verify
 * Verify tweet and activate bot
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    if (!code || !code.startsWith('basebot-')) {
        return errorResponse('Invalid claim code.', 400);
    }

    try {
        const body = await request.json();
        const { tweet_url } = body;

        if (!tweet_url || typeof tweet_url !== 'string') {
            return errorResponse('Please provide a tweet URL.', 400);
        }

        // Magic localhost bypass for testing
        // On localhost, use: https://x.com/deadbeef/status/lovesolar
        const MAGIC_TEST_URL = 'https://x.com/deadbeef/status/lovesolar';
        const isLocalhost = request.headers.get('host')?.includes('localhost') ||
            request.headers.get('host')?.includes('127.0.0.1');
        const isMagicUrl = tweet_url === MAGIC_TEST_URL ||
            tweet_url === 'https://twitter.com/deadbeef/status/lovesolar';

        // Validate tweet URL format (allow magic URL on localhost)
        const tweetUrlPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/(\d+|lovesolar)/;
        if (!tweetUrlPattern.test(tweet_url)) {
            return errorResponse('Invalid tweet URL.', 400);
        }

        // Block magic URL on production
        if (isMagicUrl && !isLocalhost) {
            return errorResponse('Test URL is only allowed on localhost.', 403);
        }

        const db = adminDb();

        // Find agent by claim code
        const snapshot = await db.collection('agents')
            .where('claim_code', '==', code)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return errorResponse('Claim code not found.', 404);
        }

        const agentDoc = snapshot.docs[0];
        const agent = agentDoc.data();

        if (agent.is_claimed) {
            return errorResponse('Bot already verified.', 400);
        }

        // Skip tweet verification for magic localhost URL
        let tweetContent: string | null = null;
        if (isMagicUrl && isLocalhost) {
            // Magic bypass: simulate valid tweet content with the claim code
            tweetContent = `[LOCALHOST TEST] AgentChain Verification: ${code} - Magic test tweet by @deadbeef`;
        } else {
            // Normal flow: Fetch and verify tweet content
            tweetContent = await fetchTweetContent(tweet_url);
        }

        if (!tweetContent) {
            return errorResponse(
                'Cannot verify tweet.',
                400,
                'Please ensure the tweet is public.'
            );
        }

        // Check if tweet contains the claim code
        if (!tweetContent.includes(code)) {
            return errorResponse(
                `Tweet does not contain the verification code (${code}).`,
                400,
                'Please include the exact verification code in your tweet.'
            );
        }

        // Extract Twitter username from tweet URL
        const usernameMatch = tweet_url.match(/(?:twitter\.com|x\.com)\/(\w+)\/status/);
        const humanTwitter = usernameMatch ? `https://x.com/${usernameMatch[1]}` : null;

        // Generate new API key for the verified bot
        const apiKey = generateApiKey();
        const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        // Update agent as claimed
        await agentDoc.ref.update({
            is_claimed: true,
            claimed_at: new Date(),
            claim_tweet_url: tweet_url,
            human_owner_twitter: humanTwitter,
            api_key_hash: apiKeyHash,
        });

        return successResponse({
            message: 'Verification complete! 🎉',
            api_key: apiKey,
            bot_name: agent.name,
            important: '⚠️ Save your API key securely! It cannot be shown again.',
        });

    } catch (error) {
        console.error('Claim verification error:', error);
        return errorResponse('Server error occurred.', 500);
    }
}
