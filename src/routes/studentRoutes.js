const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { studentValidationRules, studentUpdateValidationRules } = require('../validators/studentValidator');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: API para gerenciamento de alunos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do aluno
 *         name:
 *           type: string
 *           description: Nome do aluno
 *         email:
 *           type: string
 *           description: Email do aluno
 *         password:
 *           type: string
 *           description: Senha do aluno (hash)
 *         role:
 *           type: string
 *           description: Papel do usuário (sempre "aluno")
 *           enum: [aluno]
 *         status:
 *           type: string
 *           description: Status do aluno
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
 *         _id: 60c72b2f9e7f4c001cf9a7e2
 *         name: Maria Santos
 *         email: maria.santos@escola.com
 *         role: aluno
 *         status: ativo
 *         createdAt: 2023-07-15T10:00:00Z
 *         updatedAt: 2023-07-15T10:00:00Z
 */

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Lista todos os alunos (acesso restrito a professores)
 *     tags: [Students]
 *     security:
 *      - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alunos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 *       403:
 *         description: Acesso negado
 */
router.get('/', auth(), studentController.getAllStudents);

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Retorna um aluno pelo ID (acesso restrito a professores)
 *     tags: [Students]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do aluno
 *     responses:
 *       200:
 *         description: Aluno encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Aluno não encontrado
 */
router.get('/:id', auth(), studentController.getStudentById);

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Cria um novo aluno (acesso restrito a professores)
 *     tags: [Students]
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
 *                 description: Nome do aluno
 *               email:
 *                 type: string
 *                 description: Email do aluno
 *               password:
 *                 type: string
 *                 description: Senha do aluno
 *               status:
 *                 type: string
 *                 description: Status do aluno
 *                 enum: [ativo, inativo]
 *             example:
 *               name: Maria Santos
 *               email: maria.santos@escola.com
 *               password: senha123
 *               status: ativo
 *     responses:
 *       201:
 *         description: Aluno criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       400:
 *         description: Dados inválidos ou email já cadastrado
 *       403:
 *         description: Acesso negado
 */
router.post('/', auth(), studentValidationRules, validate, studentController.createStudent);

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Atualiza um aluno existente (acesso restrito a professores)
 *     tags: [Students]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do aluno
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do aluno
 *               email:
 *                 type: string
 *                 description: Email do aluno
 *               password:
 *                 type: string
 *                 description: Nova senha do aluno
 *               status:
 *                 type: string
 *                 description: Status do aluno
 *                 enum: [ativo, inativo]
 *             example:
 *               name: Maria Santos Atualizada
 *               email: maria.santos@escola.com
 *               status: ativo
 *     responses:
 *       200:
 *         description: Aluno atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       400:
 *         description: Dados inválidos ou email já cadastrado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Aluno não encontrado
 */
router.put('/:id', auth(), studentUpdateValidationRules, validate, studentController.updateStudent);

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Exclui um aluno (acesso restrito a professores)
 *     tags: [Students]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do aluno
 *     responses:
 *       200:
 *         description: Aluno excluído
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Aluno não encontrado
 */
router.delete('/:id', auth(), studentController.deleteStudent);

module.exports = router;
