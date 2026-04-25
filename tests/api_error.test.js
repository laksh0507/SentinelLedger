const ApiError = require('../src/utils/ApiError');

describe('ApiError Utility', () => {
    test('should correctly set statusCode and message', () => {
        const error = new ApiError(404, 'Resource not found');
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Resource not found');
        expect(error.success).toBe(false);
    });

    test('should include custom errors array if provided', () => {
        const errors = ['Invalid email', 'Password too short'];
        const error = new ApiError(400, 'Validation failed', errors);
        expect(error.errors).toEqual(errors);
    });

    test('should capture stack trace by default', () => {
        const error = new ApiError(500);
        expect(error.stack).toBeDefined();
    });
});
