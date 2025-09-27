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

// Validador para adicionar comentário
const commentValidationRules = [
    body('comment')
        .trim()
        .notEmpty()
        .withMessage('Conteúdo do comentário é obrigatório')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comentário deve ter entre 1 e 1000 caracteres')
];

// Validador para atualizar comentário (mesma regra)
const updateCommentValidationRules = commentValidationRules;

module.exports = { 
    postValidationRules,
    commentValidationRules,
    updateCommentValidationRules
};
