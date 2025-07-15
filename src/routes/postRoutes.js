const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { postValidationRules } = require('../validators/postValidator');
const validate = require('../middlewares/validate');

router.get('/', postController.getAllPosts);
router.get('/search', postController.searchPosts);
router.get('/:id', postController.getPostById);

router.post('/', postValidationRules, validate, postController.createPost);
router.put('/:id', postValidationRules, validate, postController.updatePost);

router.delete('/:id', postController.deletePost);

module.exports = router;
