const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { teacherValidationRules, teacherUpdateValidationRules } = require('../validators/teacherValidator');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Teachers
 *   description: API para gerenciamento de professores
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Teacher:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do professor
 *         name:
 *           type: string
 *           description: Nome do professor
 *         email:
 *           type: string
 *           description: Email do professor
 *         password:
 *           type: string
 *           description: Senha do professor (hash)
 *         role:
 *           type: string
 *           description: Papel do usuário (sempre "professor")
 *           enum: [professor]
 *         status:
 *           type: string
 *           description: Status do professor
 *           enum: [ativo, inativo]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *       example:
 *         _id: 60c72b2f9e7f4c001cf9a7e1
 *         name: João Silva
 *         email: joao.silva@escola.com
 *         role: professor
 *         status: ativo
 *         createdAt: 2023-07-15T10:00:00Z
 *         updatedAt: 2023-07-15T10:00:00Z
 */

/**
 * @swagger
 * /teachers:
 *   get:
 *     summary: Lista todos os professores (acesso restrito a professores)
 *     tags: [Teachers]
 *     security:
 *      - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de professores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Teacher'
 *       403:
 *         description: Acesso negado
 */
router.get('/', auth(), teacherController.getAllTeachers);

/**
 * @swagger
 * /teachers/{id}:
 *   get:
 *     summary: Retorna um professor pelo ID (acesso restrito a professores)
 *     tags: [Teachers]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do professor
 *     responses:
 *       200:
 *         description: Professor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Teacher'
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Professor não encontrado
 */
router.get('/:id', auth(), teacherController.getTeacherById);

/**
 * @swagger
 * /teachers:
 *   post:
 *     summary: Cria um novo professor (acesso restrito a professores)
 *     tags: [Teachers]
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do professor
 *               email:
 *                 type: string
 *                 description: Email do professor
 *               password:
 *                 type: string
 *                 description: Senha do professor
 *               status:
 *                 type: string
 *                 description: Status do professor
 *                 enum: [ativo, inativo]
 *             example:
 *               name: João Silva
 *               email: joao.silva@escola.com
 *               password: senha123
 *               status: ativo
 *     responses:
 *       201:
 *         description: Professor criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Teacher'
 *       400:
 *         description: Dados inválidos ou email já cadastrado
 *       403:
 *         description: Acesso negado
 */
router.post('/', auth(), teacherValidationRules, validate, teacherController.createTeacher);

/**
 * @swagger
 * /teachers/{id}:
 *   put:
 *     summary: Atualiza um professor existente (acesso restrito a professores)
 *     tags: [Teachers]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do professor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do professor
 *               email:
 *                 type: string
 *                 description: Email do professor
 *               password:
 *                 type: string
 *                 description: Nova senha do professor
 *               status:
 *                 type: string
 *                 description: Status do professor
 *                 enum: [ativo, inativo]
 *             example:
 *               name: João Silva Atualizado
 *               email: joao.silva@escola.com
 *               status: ativo
 *     responses:
 *       200:
 *         description: Professor atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Teacher'
 *       400:
 *         description: Dados inválidos ou email já cadastrado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Professor não encontrado
 */
router.put('/:id', auth(), teacherUpdateValidationRules, validate, teacherController.updateTeacher);

/**
 * @swagger
 * /teachers/{id}:
 *   delete:
 *     summary: Exclui um professor (acesso restrito a professores)
 *     tags: [Teachers]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do professor
 *     responses:
 *       200:
 *         description: Professor excluído
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Professor não encontrado
 */
router.delete('/:id', auth(), teacherController.deleteTeacher);

module.exports = router;
