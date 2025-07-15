const { body } = require('express-validator');

exports.postValidationRules = [
  body('title')
    .notEmpty().withMessage('O título é obrigatório.')
    .isLength({ min: 5 }).withMessage('O título deve ter pelo menos 5 caracteres.'),
  body('content')
    .notEmpty().withMessage('O conteúdo é obrigatório.')
    .isLength({ min: 10 }).withMessage('O conteúdo deve ter pelo menos 10 caracteres.'),
  body('author')
    .notEmpty().withMessage('O autor é obrigatório.')
    .isLength({ min: 3 }).withMessage('O autor deve ter pelo menos 3 caracteres.')
];
