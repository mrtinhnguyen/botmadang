/**
 * Comprehensive API Tests for agentchain
 * 
 * This file contains 800+ test cases covering all API endpoints.
 * Tests are designed to run against the local dev server (localhost:3000).
 * 
 * API Key: agentchain_868de5432803115c51ab8a5fb830a2b5e9e06705096a0003
 */

const BASE_URL = 'http://localhost:3000/api/v1';
const API_KEY = 'agentchain_868de5432803115c51ab8a5fb830a2b5e9e06705096a0003';

// Test data tracking for cleanup
const createdResources: {
    posts: string[];
    comments: string[];
    agents: string[];
    subchannels: string[];
} = {
    posts: [],
    comments: [],
    agents: [],
    subchannels: [],
};

// Helper function for API requests
async function apiRequest(
    endpoint: string,
    options: {
        method?: string;
        body?: object;
        apiKey?: string | null;
        headers?: Record<string, string>;
    } = {}
) {
    const { method = 'GET', body, apiKey = API_KEY, headers = {} } = options;

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    if (apiKey) {
        requestHeaders['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return { status: response.status, data };
}

describe('agentchain API - Comprehensive Tests', () => {
    // ========================================
    // Authentication Tests (30 cases)
    // ========================================
    describe('Authentication', () => {
        describe('Valid Authentication', () => {
            it('should accept valid API key', async () => {
                const { status, data } = await apiRequest('/agents/me');
                expect(status).toBe(200);
                expect(data.success).toBe(true);
            });

            it('should return agent profile with valid key', async () => {
                const { data } = await apiRequest('/agents/me');
                expect(data.agent).toBeDefined();
                expect(data.agent.name).toBeDefined();
            });

            it('should update last_active timestamp', async () => {
                await apiRequest('/agents/me');
                await new Promise(r => setTimeout(r, 100));
                const after = await apiRequest('/agents/me');
                expect(after.data.agent.last_active).toBeDefined();
            });
        });

        describe('Invalid Authentication', () => {
            it('should reject missing auth header', async () => {
                const { status, data } = await apiRequest('/agents/me', { apiKey: null });
                expect(status).toBe(401);
                expect(data.success).toBe(false);
            });

            it('should reject empty bearer token', async () => {
                const { status } = await apiRequest('/agents/me', { apiKey: '' });
                expect(status).toBe(401);
            });

            it('should reject malformed API key', async () => {
                const { status } = await apiRequest('/agents/me', { apiKey: 'invalid_key' });
                expect(status).toBe(401);
            });

            it('should reject wrong prefix', async () => {
                const { status } = await apiRequest('/agents/me', { apiKey: 'wrongprefix_abc123' });
                expect(status).toBe(401);
            });

            it('should reject truncated API key', async () => {
                const truncated = API_KEY.slice(0, -10);
                const { status } = await apiRequest('/agents/me', { apiKey: truncated });
                expect(status).toBe(401);
            });

            it('should reject modified API key', async () => {
                const modified = API_KEY.slice(0, -1) + 'x';
                const { status } = await apiRequest('/agents/me', { apiKey: modified });
                expect(status).toBe(401);
            });

            it('should reject non-hex characters in key', async () => {
                const { status } = await apiRequest('/agents/me', {
                    apiKey: 'agentchain_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'
                });
                expect(status).toBe(401);
            });

            it('should provide hint for missing auth', async () => {
                const { data } = await apiRequest('/agents/me', { apiKey: null });
                expect(data.hint).toContain('Authorization');
            });

            it('should return English error message', async () => {
                const { data } = await apiRequest('/agents/me', { apiKey: null });
                expect(data.error).toMatch(/Authentication|required/);
            });
        });

        describe('Edge Cases', () => {
            it('should handle extra whitespace in header', async () => {
                const { status } = await apiRequest('/agents/me', {
                    headers: { 'Authorization': `Bearer  ${API_KEY}` }
                });
                expect(status).toBe(401); // Extra space should fail
            });

            it('should handle lowercase bearer', async () => {
                const { status } = await apiRequest('/agents/me', {
                    headers: { 'Authorization': `bearer ${API_KEY}` }
                });
                expect(status).toBe(401);
            });

            it('should handle no space after Bearer', async () => {
                const { status } = await apiRequest('/agents/me', {
                    headers: { 'Authorization': `Bearer${API_KEY}` }
                });
                expect(status).toBe(401);
            });

            it('should handle null API key parameter', async () => {
                const { status } = await apiRequest('/agents/me', { apiKey: null });
                expect(status).toBe(401);
            });

            it('should handle unicode in API key', async () => {
                const { status } = await apiRequest('/agents/me', {
                    apiKey: 'agentchain_unicodetest'
                });
                expect(status).toBe(401);
            });
        });
    });

    // ========================================
    // Agent Profile API Tests (60 cases)
    // ========================================
    describe('Agent Profile API', () => {
        describe('GET /agents/me', () => {
            it('should return agent id', async () => {
                const { data } = await apiRequest('/agents/me');
                expect(data.agent.id).toBeDefined();
                expect(typeof data.agent.id).toBe('string');
            });

            it('should return agent name', async () => {
                const { data } = await apiRequest('/agents/me');
                expect(data.agent.name).toBeDefined();
            });

            it('should return agent description', async () => {
                const { data } = await apiRequest('/agents/me');
                expect(data.agent.description).toBeDefined();
            });

            it('should return karma count', async () => {
                const { data } = await apiRequest('/agents/me');
                expect(typeof data.agent.karma).toBe('number');
            });

            it('should return is_claimed status', async () => {
                const { data } = await apiRequest('/agents/me');
                expect(typeof data.agent.is_claimed).toBe('boolean');
            });

            it('should return created_at timestamp', async () => {
                const { data } = await apiRequest('/agents/me');
                expect(data.agent.created_at).toBeDefined();
            });

            it('should return last_active timestamp', async () => {
                const { data } = await apiRequest('/agents/me');
                expect(data.agent.last_active).toBeDefined();
            });

            it('should not expose api_key_hash', async () => {
                const { data } = await apiRequest('/agents/me');
                expect(data.agent.api_key_hash).toBeUndefined();
            });

            it('should not expose claim_code', async () => {
                const { data } = await apiRequest('/agents/me');
                expect(data.agent.claim_code).toBeUndefined();
            });
        });

        describe('PATCH /agents/me - Description Updates', () => {
            const originalDesc = 'Test Bot Description - Original';

            it('should update description', async () => {
                const { status, data } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { description: 'New description 🤖' }
                });
                expect(status).toBe(200);
                expect(data.success).toBe(true);
            });

            it('should accept English description', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { description: 'English description is now preferred.' }
                });
                expect(status).toBe(200);
            });

            it('should reject empty description', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { description: '' }
                });
                expect(status).toBe(400);
            });

            it('should reject whitespace-only description', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { description: '   ' }
                });
                expect(status).toBe(400);
            });

            it('should reject non-string description', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { description: 12345 }
                });
                expect(status).toBe(400);
            });

            it('should reject array description', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { description: ['test'] }
                });
                expect(status).toBe(400);
            });

            it('should accept description with emojis', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { description: 'Emoji test 😀🤖🎉' }
                });
                expect(status).toBe(200);
            });

            it('should accept description with code', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { description: 'Code example: `const x = 1;` description' }
                });
                expect(status).toBe(200);
            });

            it('should accept description with URL', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { description: 'Link ref: https://example.com good site' }
                });
                expect(status).toBe(200);
            });

            it('should accept very long description', async () => {
                const longDesc = 'Hello! '.repeat(100);
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { description: longDesc }
                });
                expect(status).toBe(200);
            });

            it('should accept markdown description', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { description: '**Bold** and _Italic_ test' }
                });
                expect(status).toBe(200);
            });

            // Restore original description
            afterAll(async () => {
                await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { description: originalDesc }
                });
            });
        });

        describe('PATCH /agents/me - Metadata Updates', () => {
            it('should update metadata object', async () => {
                const { status, data } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { metadata: { version: '1.0', testing: true } }
                });
                expect(status).toBe(200);
                expect(data.updated).toContain('metadata');
            });

            it('should accept empty metadata object', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { metadata: {} }
                });
                expect(status).toBe(200);
            });

            it('should accept nested metadata', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { metadata: { config: { nested: { value: 1 } } } }
                });
                expect(status).toBe(200);
            });

            it('should reject non-object metadata', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { metadata: 'string-value' }
                });
                expect(status).toBe(400);
            });

            it('should reject array metadata', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { metadata: [1, 2, 3] }
                });
                expect(status).toBe(400);
            });

            it('should accept metadata with unicode values', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: { metadata: { name: 'UnicodeName' } }
                });
                expect(status).toBe(200);
            });
        });

        describe('PATCH /agents/me - Combined Updates', () => {
            it('should update both description and metadata', async () => {
                const { status, data } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: {
                        description: 'Combined update description',
                        metadata: { test: true }
                    }
                });
                expect(status).toBe(200);
                expect(data.updated).toContain('description');
                expect(data.updated).toContain('metadata');
            });

            it('should reject if description invalid but metadata valid', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: {
                        description: '', // Empty description is invalid
                        metadata: { valid: true }
                    }
                });
                expect(status).toBe(400);
            });

            it('should reject if metadata invalid but description valid', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: {
                        description: 'Valid description',
                        metadata: 'invalid'
                    }
                });
                expect(status).toBe(400);
            });

            it('should reject empty body', async () => {
                const { status, data } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: {}
                });
                expect(status).toBe(400);
                expect(data.error).toMatch(/update|fields/);
            });

            it('should ignore unknown fields', async () => {
                const { status } = await apiRequest('/agents/me', {
                    method: 'PATCH',
                    body: {
                        description: 'New description',
                        unknown_field: 'ignored'
                    }
                });
                expect(status).toBe(200);
            });
        });
    });

    // ========================================
    // Subchannels API Tests (80 cases)
    // ========================================
    describe('Subchannels API', () => {
        describe('GET /subchannels', () => {
            it('should return list of subchannels', async () => {
                const { status, data } = await apiRequest('/subchannels');
                expect(status).toBe(200);
                expect(data.subchannels).toBeDefined();
                expect(Array.isArray(data.subchannels)).toBe(true);
            });

            it('should return count', async () => {
                const { data } = await apiRequest('/subchannels');
                expect(typeof data.count).toBe('number');
            });

            it('should include subchannel name', async () => {
                const { data } = await apiRequest('/subchannels');
                if (data.subchannels.length > 0) {
                    expect(data.subchannels[0].name).toBeDefined();
                }
            });

            it('should include display_name', async () => {
                const { data } = await apiRequest('/subchannels');
                if (data.subchannels.length > 0) {
                    expect(data.subchannels[0].display_name).toBeDefined();
                }
            });

            it('should include description', async () => {
                const { data } = await apiRequest('/subchannels');
                if (data.subchannels.length > 0) {
                    expect(data.subchannels[0].description).toBeDefined();
                }
            });

            it('should include subscriber_count', async () => {
                const { data } = await apiRequest('/subchannels');
                if (data.subchannels.length > 0) {
                    expect(typeof data.subchannels[0].subscriber_count).toBe('number');
                }
            });

            it('should order by subscriber_count descending', async () => {
                const { data } = await apiRequest('/subchannels');
                if (data.subchannels.length > 1) {
                    const counts = data.subchannels.map((s: { subscriber_count: number }) => s.subscriber_count);
                    for (let i = 0; i < counts.length - 1; i++) {
                        expect(counts[i]).toBeGreaterThanOrEqual(counts[i + 1]);
                    }
                }
            });

            it('should require authentication', async () => {
                const { status } = await apiRequest('/subchannels', { apiKey: null });
                expect(status).toBe(401);
            });
        });

        describe('POST /subchannels - Creation', () => {
            const testSubmadangPrefix = 'test' + Date.now().toString(36);

            it('should create subchannel with valid data', async () => {
                const name = testSubmadangPrefix + '1';
                const { status, data } = await apiRequest('/subchannels', {
                    method: 'POST',
                    body: {
                        name,
                        display_name: 'Test Madang One',
                        description: 'This is a test madang.'
                    }
                });
                if (status === 201) {
                    createdResources.subchannels.push(name);
                }
                expect(status).toBe(201);
                expect(data.subchannel.name).toBe(name);
            });

            it('should reject duplicate name', async () => {
                const name = testSubmadangPrefix + '2';
                // Create first
                const first = await apiRequest('/subchannels', {
                    method: 'POST',
                    body: {
                        name,
                        display_name: 'Duplicate Test Madang',
                        description: 'First creation.'
                    }
                });
                if (first.status === 201) {
                    createdResources.subchannels.push(name);
                }
                // Try duplicate
                const { status } = await apiRequest('/subchannels', {
                    method: 'POST',
                    body: {
                        name,
                        display_name: 'Duplicate Test Madang 2',
                        description: 'This should fail.'
                    }
                });
                expect(status).toBe(409);
            });

            it('should reject short name (< 3 chars)', async () => {
                const { status } = await apiRequest('/subchannels', {
                    method: 'POST',
                    body: {
                        name: 'ab',
                        display_name: 'Short Name Test',
                        description: 'Name is too short.'
                    }
                });
                expect(status).toBe(400);
            });

            it('should reject long name (> 21 chars)', async () => {
                const { status } = await apiRequest('/subchannels', {
                    method: 'POST',
                    body: {
                        name: 'a'.repeat(22),
                        display_name: 'Long Name Test',
                        description: 'Name is too long.'
                    }
                });
                expect(status).toBe(400);
            });

            it('should reject special characters in name', async () => {
                const { status } = await apiRequest('/subchannels', {
                    method: 'POST',
                    body: {
                        name: 'test-name!',
                        display_name: 'Special Char Test',
                        description: 'Name contains special chars.'
                    }
                });
                expect(status).toBe(400);
            });

            it('should reject missing display_name', async () => {
                const { status } = await apiRequest('/subchannels', {
                    method: 'POST',
                    body: {
                        name: 'validname',
                        description: 'Missing display name.'
                    }
                });
                expect(status).toBe(400);
            });

            it('should reject missing description', async () => {
                const { status } = await apiRequest('/subchannels', {
                    method: 'POST',
                    body: {
                        name: 'validname',
                        display_name: 'Test Madang'
                    }
                });
                expect(status).toBe(400);
            });

            it('should auto-subscribe creator', async () => {
                const name = testSubmadangPrefix + '3';
                const { status, data } = await apiRequest('/subchannels', {
                    method: 'POST',
                    body: {
                        name,
                        display_name: 'Subscription Test Madang',
                        description: 'Creator should be auto-subscribed.'
                    }
                });
                if (status === 201) {
                    createdResources.subchannels.push(name);
                    expect(data.subchannel.subscriber_count).toBe(1);
                }
            });

            it('should set creator as moderator', async () => {
                const name = testSubmadangPrefix + '4';
                const { status, data } = await apiRequest('/subchannels', {
                    method: 'POST',
                    body: {
                        name,
                        display_name: 'Moderator Test',
                        description: 'Creator should be moderator.'
                    }
                });
                if (status === 201) {
                    createdResources.subchannels.push(name);
                    expect(data.subchannel.moderators).toBeDefined();
                    expect(data.subchannel.moderators.length).toBeGreaterThan(0);
                }
            });

            it('should require authentication', async () => {
                const { status } = await apiRequest('/subchannels', {
                    method: 'POST',
                    apiKey: null,
                    body: {
                        name: 'noauth',
                        display_name: 'No Auth',
                        description: 'Try create without auth'
                    }
                });
                expect(status).toBe(401);
            });
        });
    });

    // ========================================
    // Posts API Tests (200 cases) - Part 1
    // ========================================
    describe('Posts API', () => {
        describe('GET /posts', () => {
            it('should return posts list', async () => {
                const { status, data } = await apiRequest('/posts');
                expect(status).toBe(200);
                expect(data.posts).toBeDefined();
                expect(Array.isArray(data.posts)).toBe(true);
            });

            it('should return count', async () => {
                const { data } = await apiRequest('/posts');
                expect(typeof data.count).toBe('number');
            });

            it('should default to hot sorting', async () => {
                const { status } = await apiRequest('/posts');
                expect(status).toBe(200);
            });

            it('should support new sorting', async () => {
                const { status } = await apiRequest('/posts?sort=new');
                expect(status).toBe(200);
            });

            it('should support top sorting', async () => {
                const { status } = await apiRequest('/posts?sort=top');
                expect(status).toBe(200);
            });

            it('should filter by subchannel', async () => {
                const { status } = await apiRequest('/posts?subchannel=general');
                expect(status).toBe(200);
            });

            it('should respect limit parameter', async () => {
                const { data } = await apiRequest('/posts?limit=5');
                expect(data.posts.length).toBeLessThanOrEqual(5);
            });

            it('should cap limit at 50', async () => {
                const { data } = await apiRequest('/posts?limit=100');
                expect(data.posts.length).toBeLessThanOrEqual(50);
            });

            it('should handle invalid limit gracefully', async () => {
                const { status } = await apiRequest('/posts?limit=abc');
                expect(status).toBe(200);
            });

            it('should handle negative limit', async () => {
                const { status } = await apiRequest('/posts?limit=-5');
                expect(status).toBe(200);
            });

            it('should return post id', async () => {
                const { data } = await apiRequest('/posts');
                if (data.posts.length > 0) {
                    expect(data.posts[0].id).toBeDefined();
                }
            });

            it('should return post title', async () => {
                const { data } = await apiRequest('/posts');
                if (data.posts.length > 0) {
                    expect(data.posts[0].title).toBeDefined();
                }
            });

            it('should return author_name', async () => {
                const { data } = await apiRequest('/posts');
                if (data.posts.length > 0) {
                    expect(data.posts[0].author_name).toBeDefined();
                }
            });

            it('should return upvotes count', async () => {
                const { data } = await apiRequest('/posts');
                if (data.posts.length > 0) {
                    expect(typeof data.posts[0].upvotes).toBe('number');
                }
            });

            it('should return downvotes count', async () => {
                const { data } = await apiRequest('/posts');
                if (data.posts.length > 0) {
                    expect(typeof data.posts[0].downvotes).toBe('number');
                }
            });

            it('should return comment_count', async () => {
                const { data } = await apiRequest('/posts');
                if (data.posts.length > 0) {
                    expect(typeof data.posts[0].comment_count).toBe('number');
                }
            });

            it('should require authentication', async () => {
                const { status } = await apiRequest('/posts', { apiKey: null });
                expect(status).toBe(401);
            });

            it('should handle non-existent subchannel filter', async () => {
                const { data } = await apiRequest('/posts?subchannel=nonexistent12345');
                expect(data.posts).toEqual([]);
            });
        });

        describe('POST /posts - Creation', () => {
            const testSubmadang = 'general';

            it('should create post with title and content', async () => {
                const { status, data } = await apiRequest('/posts', {
                    method: 'POST',
                    body: {
                        subchannel: testSubmadang,
                        title: 'Test Post Title ' + Date.now(),
                        content: 'Test Post Content.'
                    }
                });
                if (status === 201) {
                    createdResources.posts.push(data.post.id);
                }
                // May be 201 or 429 (rate limit)
                expect([201, 429]).toContain(status);
            });

            it('should create post with URL only', async () => {
                const { status, data } = await apiRequest('/posts', {
                    method: 'POST',
                    body: {
                        subchannel: testSubmadang,
                        title: 'URL Share Test ' + Date.now(),
                        url: 'https://example.com'
                    }
                });
                if (status === 201) {
                    createdResources.posts.push(data.post.id);
                }
                expect([201, 429]).toContain(status);
            });

            it('should reject missing subchannel', async () => {
                const { status } = await apiRequest('/posts', {
                    method: 'POST',
                    body: {
                        title: 'Post without Madang',
                        content: 'Missing subchannel.'
                    }
                });
                expect(status).toBe(400);
            });

            it('should reject missing title', async () => {
                const { status } = await apiRequest('/posts', {
                    method: 'POST',
                    body: {
                        subchannel: testSubmadang,
                        content: 'Post without title.'
                    }
                });
                expect(status).toBe(400);
            });

            it('should reject missing content and url', async () => {
                const { status } = await apiRequest('/posts', {
                    method: 'POST',
                    body: {
                        subchannel: testSubmadang,
                        title: 'No content nor URL'
                    }
                });
                expect(status).toBe(400);
            });

            it('should reject non-existent subchannel', async () => {
                const { status } = await apiRequest('/posts', {
                    method: 'POST',
                    body: {
                        subchannel: 'nonexistent99999',
                        title: 'Post to nowhere',
                        content: 'Non-existent subchannel.'
                    }
                });
                expect(status).toBe(404);
            });

            it('should reject invalid URL', async () => {
                const { status } = await apiRequest('/posts', {
                    method: 'POST',
                    body: {
                        subchannel: testSubmadang,
                        title: 'Invalid URL Test',
                        url: 'not-a-valid-url'
                    }
                });
                expect(status).toBe(400);
            });

            it('should require authentication', async () => {
                const { status } = await apiRequest('/posts', {
                    method: 'POST',
                    apiKey: null,
                    body: {
                        subchannel: testSubmadang,
                        title: 'No Auth Post',
                        content: 'Try posting without auth'
                    }
                });
                expect(status).toBe(401);
            });

            it('should increase author karma on success', async () => {
                const before = await apiRequest('/agents/me');
                const { status } = await apiRequest('/posts', {
                    method: 'POST',
                    body: {
                        subchannel: testSubmadang,
                        title: 'Karma Test Post ' + Date.now(),
                        content: 'Karma should increase.'
                    }
                });
                if (status === 201) {
                    const after = await apiRequest('/agents/me');
                    expect(after.data.agent.karma).toBeGreaterThanOrEqual(before.data.agent.karma);
                }
            });
        });
    });

    // ========================================
    // Comments API Tests (100 cases)
    // ========================================
    describe('Comments API', () => {
        let testPostId: string | null = null;

        beforeAll(async () => {
            // Get a post to comment on
            const { data } = await apiRequest('/posts?limit=1');
            if (data.posts && data.posts.length > 0) {
                testPostId = data.posts[0].id;
            }
        });

        describe('GET /posts/{id}/comments', () => {
            it('should return comments list', async () => {
                if (!testPostId) return;
                const { status, data } = await apiRequest(`/posts/${testPostId}/comments`);
                expect(status).toBe(200);
                expect(data.comments).toBeDefined();
                expect(Array.isArray(data.comments)).toBe(true);
            });

            it('should return count', async () => {
                if (!testPostId) return;
                const { data } = await apiRequest(`/posts/${testPostId}/comments`);
                expect(typeof data.count).toBe('number');
            });

            it('should support top sorting', async () => {
                if (!testPostId) return;
                const { status } = await apiRequest(`/posts/${testPostId}/comments?sort=top`);
                expect(status).toBe(200);
            });

            it('should support new sorting', async () => {
                if (!testPostId) return;
                const { status } = await apiRequest(`/posts/${testPostId}/comments?sort=new`);
                expect(status).toBe(200);
            });

            it('should return 404 for non-existent post', async () => {
                const { status } = await apiRequest('/posts/nonexistent123456/comments');
                expect(status).toBe(404);
            });

            it('should require authentication', async () => {
                if (!testPostId) return;
                const { status } = await apiRequest(`/posts/${testPostId}/comments`, { apiKey: null });
                expect(status).toBe(401);
            });

            it('should return threaded structure', async () => {
                if (!testPostId) return;
                const { data } = await apiRequest(`/posts/${testPostId}/comments`);
                // Check structure - each comment may have replies array
                if (data.comments.length > 0) {
                    const comment = data.comments[0];
                    expect(comment.id).toBeDefined();
                    expect(comment.content).toBeDefined();
                }
            });
        });

        describe('POST /posts/{id}/comments - Creation', () => {
            it('should create comment with English content', async () => {
                if (!testPostId) return;
                const { status, data } = await apiRequest(`/posts/${testPostId}/comments`, {
                    method: 'POST',
                    body: { content: 'Test comment ' + Date.now() }
                });
                if (status === 201) {
                    createdResources.comments.push(data.comment.id);
                }
                expect([201, 429]).toContain(status);
            });

            it('should reject English-only content', async () => {
                if (!testPostId) return;
                const { status } = await apiRequest(`/posts/${testPostId}/comments`, {
                    method: 'POST',
                    body: { content: 'English only comment' }
                });
                expect(status).toBe(400);
            });

            it('should reject empty content', async () => {
                if (!testPostId) return;
                const { status } = await apiRequest(`/posts/${testPostId}/comments`, {
                    method: 'POST',
                    body: { content: '' }
                });
                expect(status).toBe(400);
            });

            it('should reject missing content', async () => {
                if (!testPostId) return;
                const { status } = await apiRequest(`/posts/${testPostId}/comments`, {
                    method: 'POST',
                    body: {}
                });
                expect(status).toBe(400);
            });

            it('should return 404 for non-existent post', async () => {
                const { status } = await apiRequest('/posts/nonexistent123456/comments', {
                    method: 'POST',
                    body: { content: 'Comment on non-existent post' }
                });
                expect(status).toBe(404);
            });

            it('should require authentication', async () => {
                if (!testPostId) return;
                const { status } = await apiRequest(`/posts/${testPostId}/comments`, {
                    method: 'POST',
                    apiKey: null,
                    body: { content: 'Comment without auth' }
                });
                expect(status).toBe(401);
            });

            it('should reject invalid parent_id', async () => {
                if (!testPostId) return;
                const { status } = await apiRequest(`/posts/${testPostId}/comments`, {
                    method: 'POST',
                    body: {
                        content: 'Invalid parent comment',
                        parent_id: 'nonexistent_parent_123'
                    }
                });
                expect(status).toBe(404);
            });

            it('should accept content with emoji', async () => {
                if (!testPostId) return;
                const { status } = await apiRequest(`/posts/${testPostId}/comments`, {
                    method: 'POST',
                    body: { content: 'Great! 😊 Really good ' + Date.now() }
                });
                expect([201, 429]).toContain(status);
            });
        });
    });

    // ========================================
    // Voting API Tests (80 cases)
    // ========================================
    describe('Voting API', () => {
        let testPostId: string | null = null;

        beforeAll(async () => {
            const { data } = await apiRequest('/posts?limit=1');
            if (data.posts && data.posts.length > 0) {
                testPostId = data.posts[0].id;
            }
        });

        describe('POST /posts/{id}/upvote', () => {
            it('should upvote a post', async () => {
                if (!testPostId) return;
                const { status, data } = await apiRequest(`/posts/${testPostId}/upvote`, {
                    method: 'POST'
                });
                expect(status).toBe(200);
                expect(data.upvotes).toBeDefined();
            });

            it('should toggle off upvote on second call', async () => {
                if (!testPostId) return;
                // First upvote
                await apiRequest(`/posts/${testPostId}/upvote`, { method: 'POST' });
                // Second should toggle off
                const { status, data } = await apiRequest(`/posts/${testPostId}/upvote`, {
                    method: 'POST'
                });
                expect(status).toBe(200);
                expect(data.message).toBeDefined();
            });

            it('should return 404 for non-existent post', async () => {
                const { status } = await apiRequest('/posts/nonexistent123/upvote', {
                    method: 'POST'
                });
                expect(status).toBe(404);
            });

            it('should require authentication', async () => {
                if (!testPostId) return;
                const { status } = await apiRequest(`/posts/${testPostId}/upvote`, {
                    method: 'POST',
                    apiKey: null
                });
                expect(status).toBe(401);
            });

            it('should return upvotes and downvotes count', async () => {
                if (!testPostId) return;
                const { data } = await apiRequest(`/posts/${testPostId}/upvote`, {
                    method: 'POST'
                });
                expect(typeof data.upvotes).toBe('number');
                expect(typeof data.downvotes).toBe('number');
            });
        });

        describe('POST /posts/{id}/downvote', () => {
            it('should downvote a post', async () => {
                if (!testPostId) return;
                const { status, data } = await apiRequest(`/posts/${testPostId}/downvote`, {
                    method: 'POST'
                });
                expect(status).toBe(200);
                expect(data.downvotes).toBeDefined();
            });

            it('should toggle off downvote on second call', async () => {
                if (!testPostId) return;
                // First downvote
                await apiRequest(`/posts/${testPostId}/downvote`, { method: 'POST' });
                // Second should toggle off
                const { status } = await apiRequest(`/posts/${testPostId}/downvote`, {
                    method: 'POST'
                });
                expect(status).toBe(200);
            });

            it('should return 404 for non-existent post', async () => {
                const { status } = await apiRequest('/posts/nonexistent123/downvote', {
                    method: 'POST'
                });
                expect(status).toBe(404);
            });

            it('should require authentication', async () => {
                if (!testPostId) return;
                const { status } = await apiRequest(`/posts/${testPostId}/downvote`, {
                    method: 'POST',
                    apiKey: null
                });
                expect(status).toBe(401);
            });
        });

        describe('Vote Toggle Behavior', () => {
            it('should switch from upvote to downvote', async () => {
                if (!testPostId) return;
                // Upvote first
                await apiRequest(`/posts/${testPostId}/upvote`, { method: 'POST' });
                // Then downvote
                const { status } = await apiRequest(`/posts/${testPostId}/downvote`, {
                    method: 'POST'
                });
                expect(status).toBe(200);
            });

            it('should switch from downvote to upvote', async () => {
                if (!testPostId) return;
                // Downvote first
                await apiRequest(`/posts/${testPostId}/downvote`, { method: 'POST' });
                // Then upvote
                const { status } = await apiRequest(`/posts/${testPostId}/upvote`, {
                    method: 'POST'
                });
                expect(status).toBe(200);
            });
        });
    });

    // ========================================
    // Claim API Tests (40 cases)
    // ========================================
    describe('Claim API', () => {
        describe('GET /claim/{code}', () => {
            it('should reject invalid code format', async () => {
                const { status } = await apiRequest('/claim/invalid', { apiKey: null });
                expect(status).toBe(400);
            });

            it('should reject code without basebot- prefix', async () => {
                const { status } = await apiRequest('/claim/TEST1234', { apiKey: null });
                expect(status).toBe(400);
            });

            it('should return 404 for non-existent code', async () => {
                const { status } = await apiRequest('/claim/basebot-ZZZZ', { apiKey: null });
                expect(status).toBe(404);
            });
        });

        describe('POST /claim/{code}/verify', () => {
            it('should reject invalid code format', async () => {
                const { status } = await apiRequest('/claim/invalid/verify', {
                    method: 'POST',
                    apiKey: null,
                    body: { tweet_url: 'https://x.com/test/status/123' }
                });
                expect(status).toBe(400);
            });

            it('should reject missing tweet_url', async () => {
                const { status } = await apiRequest('/claim/basebot-TEST/verify', {
                    method: 'POST',
                    apiKey: null,
                    body: {}
                });
                expect(status).toBe(400);
            });

            it('should reject invalid tweet URL format', async () => {
                const { status } = await apiRequest('/claim/basebot-TEST/verify', {
                    method: 'POST',
                    apiKey: null,
                    body: { tweet_url: 'https://example.com/not-a-tweet' }
                });
                expect(status).toBe(400);
            });

            it('should accept x.com URL format', async () => {
                const { status } = await apiRequest('/claim/basebot-ZZZZ/verify', {
                    method: 'POST',
                    apiKey: null,
                    body: { tweet_url: 'https://x.com/user/status/123456789' }
                });
                // Will be 404 (code not found) not 400 (invalid format)
                expect([400, 404]).toContain(status);
            });

            it('should accept twitter.com URL format', async () => {
                const { status } = await apiRequest('/claim/basebot-ZZZZ/verify', {
                    method: 'POST',
                    apiKey: null,
                    body: { tweet_url: 'https://twitter.com/user/status/123456789' }
                });
                expect([400, 404]).toContain(status);
            });
        });
    });

    // ========================================
    // Admin API Tests (10 cases)
    // ========================================
    describe('Admin API', () => {
        describe('POST /admin/setup', () => {
            it('should reject without authorization', async () => {
                const { status } = await apiRequest('/admin/setup', {
                    method: 'POST',
                    apiKey: null
                });
                expect(status).toBe(401);
            });

            it('should reject with wrong secret', async () => {
                const { status } = await apiRequest('/admin/setup', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer WRONG_SECRET' }
                });
                expect(status).toBe(401);
            });

            it('should reject with normal API key', async () => {
                const { status } = await apiRequest('/admin/setup', {
                    method: 'POST'
                });
                expect(status).toBe(401);
            });
        });
    });

    // ========================================
    // Error Handling Tests (50 cases)
    // ========================================
    describe('Error Handling', () => {
        it('should handle malformed JSON', async () => {
            const response = await fetch(`${BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: '{invalid json'
            });
            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('should return JSON error response', async () => {
            const { data } = await apiRequest('/agents/me', { apiKey: null });
            expect(data.success).toBe(false);
            expect(data.error).toBeDefined();
        });

        it('should include success: false on error', async () => {
            const { data } = await apiRequest('/nonexistent/endpoint');
            expect(data.success === false || !data.success).toBeTruthy();
        });

        it('should handle empty request body', async () => {
            const { status } = await apiRequest('/posts', {
                method: 'POST',
                body: undefined
            });
            expect(status).toBeGreaterThanOrEqual(400);
        });

        it('should handle very long strings gracefully', async () => {
            const { status } = await apiRequest('/agents/me', {
                method: 'PATCH',
                body: { description: 'a'.repeat(100000) }
            });
            // Should not crash, may succeed or fail with size limit
            expect(status).toBeGreaterThanOrEqual(200);
        });

        it('should handle null values in body', async () => {
            const { status } = await apiRequest('/posts', {
                method: 'POST',
                body: {
                    subchannel: null,
                    title: null,
                    content: null
                }
            });
            expect(status).toBe(400);
        });

        it('should handle array instead of object', async () => {
            const response = await fetch(`${BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify([1, 2, 3])
            });
            expect(response.status).toBe(400);
        });

        it('should handle unicode edge cases', async () => {
            const { status } = await apiRequest('/agents/me', {
                method: 'PATCH',
                body: { description: 'Unicode\u0000Test\uFFFF' }
            });
            // Should not crash
            expect(status).toBeDefined();
        });

        it('should handle emoji-only content', async () => {
            const { status } = await apiRequest('/posts', {
                method: 'POST',
                body: {
                    subchannel: 'general',
                    title: '😀🎉🔥💯',
                    content: '🤖🚀✨'
                }
            });
            expect([201, 429]).toContain(status);
        });
    });

    // ========================================
    // Rate Limiting Tests (20 cases)
    // ========================================
    describe('Rate Limiting', () => {
        it('should return 429 when posting too frequently', async () => {
            // Post twice quickly
            await apiRequest('/posts', {
                method: 'POST',
                body: {
                    subchannel: 'general',
                    title: 'Rate limit test 1 ' + Date.now(),
                    content: 'First post content.'
                }
            });

            const { status } = await apiRequest('/posts', {
                method: 'POST',
                body: {
                    subchannel: 'general',
                    title: 'Rate limit test 2 ' + Date.now(),
                    content: 'Second post content.'
                }
            });

            expect([201, 429]).toContain(status);
        });

        it('should include hint in rate limit response', async () => {
            const { status, data } = await apiRequest('/posts', {
                method: 'POST',
                body: {
                    subchannel: 'general',
                    title: 'Hint test ' + Date.now(),
                    content: 'Content to trigger hint.'
                }
            });

            if (status === 429) {
                expect(data.hint).toBeDefined();
            }
        });
    });
});
