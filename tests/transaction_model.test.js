const Transaction = require('../src/models/transaction');
const mongoose = require('mongoose');

describe('Transaction Model Unit Tests', () => {
    test('should validate a correct transaction object', () => {
        const txn = new Transaction({
            fromAccount: new mongoose.Types.ObjectId(),
            toAccount: new mongoose.Types.ObjectId(),
            amount: 500,
            idempotencyKey: 'unique-key-123'
        });
        const err = txn.validateSync();
        expect(err).toBeUndefined();
    });

    test('should default status to PENDING', () => {
        const txn = new Transaction({
            fromAccount: new mongoose.Types.ObjectId(),
            toAccount: new mongoose.Types.ObjectId(),
            amount: 500,
            idempotencyKey: 'unique-key-123'
        });
        expect(txn.status).toBe('PENDING');
    });

    test('should fail if amount is negative', () => {
        const txn = new Transaction({
            fromAccount: new mongoose.Types.ObjectId(),
            toAccount: new mongoose.Types.ObjectId(),
            amount: -10,
            idempotencyKey: 'unique-key-123'
        });
        const err = txn.validateSync();
        expect(err.errors.amount).toBeDefined();
    });

    test('should require idempotencyKey', () => {
        const txn = new Transaction({
            fromAccount: new mongoose.Types.ObjectId(),
            toAccount: new mongoose.Types.ObjectId(),
            amount: 500
        });
        const err = txn.validateSync();
        expect(err.errors.idempotencyKey).toBeDefined();
    });
});
