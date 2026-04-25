const asyncHandler = require('../src/utils/asyncHandler');

describe('asyncHandler Utility', () => {
    test('should execute the passed function', async () => {
        const mockFn = jest.fn().mockResolvedValue('success');
        const req = {}, res = {}, next = jest.fn();
        
        const handled = asyncHandler(mockFn);
        await handled(req, res, next);
        
        expect(mockFn).toHaveBeenCalledWith(req, res, next);
    });

    test('should catch errors and pass them to next', async () => {
        const error = new Error('Async error');
        const mockFn = jest.fn().mockRejectedValue(error);
        const req = {}, res = {}, next = jest.fn();
        
        const handled = asyncHandler(mockFn);
        await handled(req, res, next);
        
        expect(next).toHaveBeenCalledWith(error);
    });

    test('should resolve correctly for synchronous functions', async () => {
        const mockFn = jest.fn((req, res, next) => 'sync');
        const req = {}, res = {}, next = jest.fn();
        
        const handled = asyncHandler(mockFn);
        await handled(req, res, next);
        
        expect(mockFn).toHaveBeenCalled();
    });

    test('should work with custom ApiErrors', async () => {
        const ApiError = require('../src/utils/ApiError');
        const apiError = new ApiError(400, 'Bad Request');
        const mockFn = jest.fn().mockRejectedValue(apiError);
        const req = {}, res = {}, next = jest.fn();
        
        const handled = asyncHandler(mockFn);
        await handled(req, res, next);
        
        expect(next).toHaveBeenCalledWith(apiError);
    });
});
