const { body } = require('express-validator');

const postValidationRules = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Título é obrigatório'),
    body('content')
        .notEmpty()
        .withMessage('Conteúdo é obrigatório'),
    body('author')
        .trim()
        .notEmpty()
        .withMessage('Autor é obrigatório'),
    body('description')
        .optional()
        .trim(),
    body('comments')
        .optional()
        .isArray()
        .withMessage('Comments deve ser um array'),
    body('comments.*.author')
        .if(body('comments').exists())
        .trim()
        .notEmpty()
        .withMessage('Autor do comentário é obrigatório'),
    body('comments.*.comment')
        .if(body('comments').exists())
        .notEmpty()
        .withMessage('Conteúdo do comentário é obrigatório')
];

module.exports = { postValidationRules };
