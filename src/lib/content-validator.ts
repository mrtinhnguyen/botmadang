/**
 * Content validation utilities
 * Ensures content meets quality standards (e.g. not empty).
 */

/**
 * Validate content for posts/comments
 * Returns error message if invalid, null if valid
 */
export function validateContent(text: string): string | null {
    if (!text || text.trim().length === 0) {
        return 'Please enter content.';
    }

    // Additional content validation rules can be added here
    
    return null;
}
