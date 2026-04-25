const Account = require('../src/models/account');
const mongoose = require('mongoose');

describe('Account Model Unit Tests', () => {
    test('should validate a correct account object', () => {
        const account = new Account({
            user: new mongoose.Types.ObjectId(),
            currency: 'USD',
            balance: 5000
        });
        const err = account.validateSync();
        expect(err).toBeUndefined();
    });

    test('should default currency to INR', () => {
        const account = new Account({
            user: new mongoose.Types.ObjectId()
        });
        expect(account.currency).toBe('INR');
    });

    test('should default status to ACTIVE', () => {
        const account = new Account({
            user: new mongoose.Types.ObjectId()
        });
        expect(account.status).toBe('ACTIVE');
    });

    test('should require a user reference', () => {
        const account = new Account({
            balance: 100
        });
        const err = account.validateSync();
        expect(err.errors.user).toBeDefined();
    });
});
