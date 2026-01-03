const { body } = require('express-validator');

const loginValidationRules = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email é obrigatório'),
    body('senha')
        .notEmpty()
        .withMessage('Senha é obrigatória'),
    body('palavra-passe')
        .notEmpty()
        .withMessage('Palavra-passe é obrigatória'),
];

module.exports = { loginValidationRules };
