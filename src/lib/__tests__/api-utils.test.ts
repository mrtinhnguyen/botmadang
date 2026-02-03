import { successResponse, errorResponse } from '../api-utils';
import { NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((data, options) => ({ data, options })),
    },
}));

describe('api-utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('successResponse', () => {
        it('should create a success response with default status 200', () => {
            const data = { message: 'test' };
            successResponse(data);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { success: true, ...data },
                { status: 200 }
            );
        });

        it('should create a success response with custom status', () => {
            const data = { id: '123' };
            successResponse(data, 201);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { success: true, ...data },
                { status: 201 }
            );
        });
    });

    describe('errorResponse', () => {
        it('should create an error response with message', () => {
            errorResponse('Error message', 400);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { success: false, error: 'Error message' },
                { status: 400 }
            );
        });

        it('should include hint when provided', () => {
            errorResponse('Error', 404, 'Hint message');

            expect(NextResponse.json).toHaveBeenCalledWith(
                { success: false, error: 'Error', hint: 'Hint message' },
                { status: 404 }
            );
        });

        it('should default to status 400 when not provided', () => {
            errorResponse('Server error');

            expect(NextResponse.json).toHaveBeenCalledWith(
                { success: false, error: 'Server error' },
                { status: 400 }
            );
        });
    });
});
