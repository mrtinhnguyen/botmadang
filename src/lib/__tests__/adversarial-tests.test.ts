/**
 * Adversarial Bug Hunting Tests
 * 
 * Purpose: Try to BREAK the main code by testing:
 * - Input validation weaknesses
 * - Type coercion bugs
 * - Boundary conditions
 * - Race conditions
 * - Logic errors
 * - Security vulnerabilities
 * - Off-by-one errors
 */

import {
    hashApiKey,
    isValidApiKeyFormat,
} from '../auth';

describe('Adversarial Bug Hunting Tests', () => {
    // ========================================
    // TYPE COERCION ATTACKS
    // Try to trick functions with wrong types
    // ========================================
    describe('Type Coercion Attacks', () => {
        describe('hashApiKey type coercion', () => {
            it('should handle number input without crashing', () => {
                // @ts-expect-error: testing invalid input
                expect(() => hashApiKey(12345)).not.toThrow();
            });

            it('should handle null input', () => {
                // @ts-expect-error: testing invalid input
                expect(() => hashApiKey(null)).not.toThrow();
            });

            it('should handle undefined input', () => {
                // @ts-expect-error: testing invalid input
                expect(() => hashApiKey(undefined)).not.toThrow();
            });

            it('should handle object input', () => {
                // @ts-expect-error: testing invalid input
                expect(() => hashApiKey({ key: 'value' })).not.toThrow();
            });

            it('should handle empty object', () => {
                // @ts-expect-error: testing invalid input
                expect(() => hashApiKey({})).not.toThrow();
            });
        });

        describe('isValidApiKeyFormat type coercion', () => {
            it('should reject number input', () => {
                // @ts-expect-error: testing invalid input
                expect(isValidApiKeyFormat(12345)).toBe(false);
            });

            it('should reject null', () => {
                // @ts-expect-error: testing invalid input
                expect(isValidApiKeyFormat(null)).toBe(false);
            });

            it('should reject undefined', () => {
                // @ts-expect-error: testing invalid input
                expect(isValidApiKeyFormat(undefined)).toBe(false);
            });

            it('should reject object', () => {
                // @ts-expect-error: testing invalid input
                expect(isValidApiKeyFormat({})).toBe(false);
            });

            it('should reject array', () => {
                // @ts-expect-error: testing invalid input
                expect(isValidApiKeyFormat([])).toBe(false);
            });
        });
    });

    // ========================================
    // PROTOTYPE POLLUTION ATTACKS
    // Try to exploit prototype chain
    // ========================================
    describe('Prototype Pollution Attacks', () => {
        it('should hash __proto__ safely', () => {
            expect(() => hashApiKey('__proto__')).not.toThrow();
        });

        it('should hash JSON with __proto__', () => {
            const malicious = JSON.stringify({ __proto__: { admin: true } });
            expect(() => hashApiKey(malicious)).not.toThrow();
        });
    });

    // ========================================
    // REGEX DENIAL OF SERVICE (ReDoS)
    // Try to cause catastrophic backtracking
    // ========================================
    describe('ReDoS Attacks', () => {
        it('should handle (a+)+ nested quantifiers pattern', () => {
            const payload = 'a'.repeat(50) + 'b';
            const start = Date.now();
            isValidApiKeyFormat(payload);
            expect(Date.now() - start).toBeLessThan(100);
        });

        it('should handle long agentchain prefix variations', () => {
            const payload = 'agentchain' + '_'.repeat(1000) + 'a'.repeat(48);
            const start = Date.now();
            isValidApiKeyFormat(payload);
            expect(Date.now() - start).toBeLessThan(100);
        });

        it('should handle many underscores', () => {
            const payload = 'agentchain' + '_'.repeat(10000);
            const start = Date.now();
            isValidApiKeyFormat(payload);
            expect(Date.now() - start).toBeLessThan(100);
        });

        it('should handle mixed valid/invalid chars', () => {
            const payload = 'agentchain_' + 'az'.repeat(1000);
            const start = Date.now();
            isValidApiKeyFormat(payload);
            expect(Date.now() - start).toBeLessThan(100);
        });
    });
});
