const { register, login } = require('../src/controllers/authcontroller');
const usermodel = require('../src/models/user');
const ApiError = require('../src/utils/ApiError');

jest.mock('../src/models/user');
jest.mock('../src/services/email');

describe('Auth Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    test('register should throw error if fields are missing', async () => {
        req.body = { name: 'John' }; // missing email, password
        await register(req, res, next);
        
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('required');
    });

    test('login should throw error if user not found', async () => {
        req.body = { email: 'wrong@test.com', password: 'password123' };
        usermodel.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(null)
        });

        await login(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('register should throw error if user already exists', async () => {
        req.body = { name: 'John', email: 'exists@test.com', password: 'password123' };
        usermodel.findOne.mockResolvedValue({ email: 'exists@test.com' });

        await register(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(409);
    });

    test('login should throw error if password incorrect', async () => {
        req.body = { email: 'john@test.com', password: 'wrong-password' };
        usermodel.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: 'user-id',
                comparePassword: jest.fn().mockResolvedValue(false)
            })
        });

        await login(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(401);
    });
});
