const express = require('express');
const { login } = require('../controllers/authController');
const { loginValidationRules } = require('../validators/authValidator');
const validate = require('../middlewares/validate');

const router = express.Router();

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Realiza login e retorna um token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *               - palavra-passe
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *                 example: admin
 *               senha:
 *                 type: string
 *                 description: Senha do usuário
 *                 example: admin
 *               palavra-passe:
 *                 type: string
 *                 description: Palavra-passe para validação (deve ser "secreta123")
 *                 example: secreta123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login realizado com sucesso.
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: admin
 *                     role:
 *                       type: string
 *                       example: professor
 *       401:
 *         description: Credenciais inválidas ou palavra-passe incorreta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email ou senha incorretos.
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', loginValidationRules, validate, login);

module.exports = router;
