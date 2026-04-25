const ApiResponse = require('../src/utils/ApiResponse');

describe('ApiResponse Utility', () => {
    test('should correctly format success response', () => {
        const data = { id: 1, balance: 100 };
        const response = new ApiResponse(200, data, 'Success');
        
        expect(response.statusCode).toBe(200);
        expect(response.data).toEqual(data);
        expect(response.message).toBe('Success');
        expect(response.success).toBe(true);
    });

    test('should default to "Success" message if not provided', () => {
        const response = new ApiResponse(201, {});
        expect(response.message).toBe('Success');
    });
});
