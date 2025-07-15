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
];

module.exports = { postValidationRules };
