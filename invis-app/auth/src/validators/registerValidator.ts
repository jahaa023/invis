// Validates username and password when registering accounts
import { check, ValidationChain } from 'express-validator';

export const registerValidator = (): ValidationChain[] => [
    // Username validation
    check('username')
        .isLength({ min: 5, max: 20 })
        .withMessage('Username must be between 5-20 characters.')
        .custom((value: string) => /^[\x00-\x7F]*$/.test(value))
        .withMessage('Username must contain only ASCII characters.')
        .custom((value: string) => !/\s/.test(value))
        .withMessage('Username cannot contain whitespace.')
        .trim()
        .escape(),

    // Password validation
    check('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters.')
        .trim()
        .escape()
];