const { authMiddleware } = require('../src/middlewares/auth.middleware');
const usermodel = require('../src/models/user');
const jwt = require('jsonwebtoken');
const blacklistModel = require('../src/models/blacklist');
const ApiError = require('../src/utils/ApiError');

jest.mock('../src/models/user');
jest.mock('jsonwebtoken');
jest.mock('../src/models/blacklist');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            cookies: {}
        };
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
    });

    test('should call next with 401 error if token is missing', async () => {
        await authMiddleware(req, res, next);
        
        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Unauthorized access, token is missing');
    });

    test('should call next with 401 if token is blacklisted', async () => {
        req.cookies.token = 'blacklisted-token';
        blacklistModel.findOne.mockResolvedValue({ token: 'blacklisted-token' });

        await authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(401);
        expect(error.message).toContain('Session expired');
    });

    test('should attach user to req and call next if token is valid', async () => {
        req.cookies.token = 'valid-token';
        blacklistModel.findOne.mockResolvedValue(null);
        jwt.verify.mockReturnValue({ id: 'user-id' });
        usermodel.findById.mockResolvedValue({ _id: 'user-id', name: 'Test User' });

        await authMiddleware(req, res, next);

        expect(next).toHaveBeenCalledWith(); // Called with no arguments
        expect(req.user).toBeDefined();
        expect(req.user.name).toBe('Test User');
    });
});

describe('System User Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { cookies: {} };
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
    });

    test('should throw 401 if systemUser flag is false', async () => {
        const { systemUserMiddleware } = require('../src/middlewares/auth.middleware');
        req.cookies.token = 'valid-token';
        blacklistModel.findOne.mockResolvedValue(null);
        jwt.verify.mockReturnValue({ id: 'user-id' });
        usermodel.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: 'user-id', systemUser: false })
        });

        await systemUserMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error.message).toContain('system user privilege required');
    });

    test('should pass if systemUser flag is true', async () => {
        const { systemUserMiddleware } = require('../src/middlewares/auth.middleware');
        req.cookies.token = 'valid-token';
        blacklistModel.findOne.mockResolvedValue(null);
        jwt.verify.mockReturnValue({ id: 'user-id' });
        usermodel.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: 'user-id', systemUser: true })
        });

        await systemUserMiddleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.user.systemUser).toBe(true);
    });

    test('should throw 401 if token is missing in system middleware', async () => {
        const { systemUserMiddleware } = require('../src/middlewares/auth.middleware');
        await systemUserMiddleware(req, res, next);
        expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

    test('should throw 401 if token is blacklisted in system middleware', async () => {
        const { systemUserMiddleware } = require('../src/middlewares/auth.middleware');
        req.cookies.token = 'bad-token';
        blacklistModel.findOne.mockResolvedValue({ token: 'bad-token' });
        await systemUserMiddleware(req, res, next);
        expect(next.mock.calls[0][0].message).toContain('Session expired');
    });
});
