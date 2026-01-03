const { body } = require('express-validator');

const teacherValidationRules = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Nome é obrigatório')
        .isLength({ min: 3 })
        .withMessage('Nome deve ter no mínimo 3 caracteres'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email é obrigatório')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Senha é obrigatória')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive deve ser um valor booleano'),
];

const teacherUpdateValidationRules = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Nome não pode ser vazio')
        .isLength({ min: 3 })
        .withMessage('Nome deve ter no mínimo 3 caracteres'),
    body('email')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Email não pode ser vazio')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('password')
        .optional()
        .notEmpty()
        .withMessage('Senha não pode ser vazia')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive deve ser um valor booleano'),
];

module.exports = { 
    teacherValidationRules,
    teacherUpdateValidationRules
};
