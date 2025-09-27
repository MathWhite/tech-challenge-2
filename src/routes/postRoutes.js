const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { postValidationRules, commentValidationRules, updateCommentValidationRules } = require('../validators/postValidator');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: API para gerenciamento de posts
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - author
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único do post
 *         title:
 *           type: string
 *           description: Título do post
 *         content:
 *           type: string
 *           description: Conteúdo do post
 *         author:
 *           type: string
 *           description: Autor do post
 *         description:
 *           type: string
 *           description: Descrição do post
 *         comments:
 *           type: array
 *           description: Lista de comentários do post
 *           items:
 *             type: object
 *             properties:
 *               author:
 *                 type: string
 *                 description: Autor do comentário
 *               comment:
 *                 type: string
 *                 description: Conteúdo do comentário
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: Data de criação do comentário
 *         isActive:
 *           type: boolean
 *           description: Indica se o post está ativo (visível para alunos)
 *         readTime:
 *           type: string
 *           description: Tempo estimado de leitura
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
 *         title: Meu Post
 *         content: Conteúdo interessante
 *         author: Matheus
 *         description: Uma breve descrição do post
 *         comments:
 *           - author: joazinho
 *             comment: Sensacional!
 *             createdAt: 2023-07-15T10:30:00Z
 *         isActive: true
 *         readTime: 3 min
 *         createdAt: 2023-07-15T10:00:00Z
 *         updatedAt: 2023-07-15T10:00:00Z
 */

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Lista todos os posts
 *     tags: [Posts]
 *     security:
 *      - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
router.get('/', auth(), postController.getAllPosts);

/**
 * @swagger
 * /posts/search:
 *   get:
 *     summary: Busca posts por título ou conteúdo
 *     tags: [Posts]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Termo da busca
 *     responses:
 *       200:
 *         description: Resultados da busca
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
router.get('/search', auth(), postController.searchPosts);

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Retorna um post pelo ID
 *     tags: [Posts]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do post
 *     responses:
 *       200:
 *         description: Post encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post não encontrado
 */
router.get('/:id', auth(), postController.getPostById);

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Cria um novo post
 *     tags: [Posts]
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       201:
 *         description: Post criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Dados inválidos
 */
router.post('/', auth(), postValidationRules, validate, postController.createPost);

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Atualiza um post existente
 *     tags: [Posts]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: Post atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Post não encontrado
 */
router.put('/:id', auth(), postValidationRules, validate, postController.updatePost);

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Exclui um post
 *     tags: [Posts]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do post
 *     responses:
 *       200:
 *         description: Post excluído
 *       404:
 *         description: Post não encontrado
 */
router.delete('/:id', auth(), postController.deletePost);

/**
 * @swagger
 * /posts/{id}/comments:
 *   post:
 *     summary: Adiciona um comentário ao post
 *     tags: [Posts]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Conteúdo do comentário
 *             example:
 *               comment: "Comentário teste"
 *     responses:
 *       201:
 *         description: Comentário adicionado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Post não encontrado
 */
router.post('/:id/comments', auth(), commentValidationRules, validate, postController.addComment);

/**
 * @swagger
 * /posts/{id}/comments/{commentId}:
 *   put:
 *     summary: Atualiza um comentário específico
 *     tags: [Posts]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do post
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do comentário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Novo conteúdo do comentário
 *             example:
 *               comment: "Comentário atualizado"
 *     responses:
 *       200:
 *         description: Comentário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem permissão para atualizar este comentário
 *       404:
 *         description: Post ou comentário não encontrado
 */
router.put('/:id/comments/:commentId', auth(), updateCommentValidationRules, validate, postController.updateComment);

/**
 * @swagger
 * /posts/{id}/comments/{commentId}:
 *   delete:
 *     summary: Remove um comentário específico
 *     tags: [Posts]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do post
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do comentário
 *     responses:
 *       200:
 *         description: Comentário removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comentário deletado com sucesso."
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       403:
 *         description: Sem permissão para deletar este comentário
 *       404:
 *         description: Post ou comentário não encontrado
 */
router.delete('/:id/comments/:commentId', auth(), postController.deleteComment);

module.exports = router;
