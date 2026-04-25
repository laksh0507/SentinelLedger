const User = require('../src/models/user');
const mongoose = require('mongoose');

describe('User Model Unit Tests', () => {
    test('should validate a correct user object', () => {
        const user = new User({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123'
        });
        const err = user.validateSync();
        expect(err).toBeUndefined();
    });

    test('should fail if email is invalid', () => {
        const user = new User({
            name: 'John Doe',
            email: 'invalid-email',
            password: 'password123'
        });
        const err = user.validateSync();
        expect(err.errors.email).toBeDefined();
    });

    test('should fail if password is too short', () => {
        const user = new User({
            name: 'John Doe',
            email: 'john@example.com',
            password: '123'
        });
        const err = user.validateSync();
        expect(err.errors.password).toBeDefined();
    });

    test('should default systemUser to false', () => {
        const user = new User({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123'
        });
        expect(user.systemUser).toBe(false);
    });
});
