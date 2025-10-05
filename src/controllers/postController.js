const Post = require('../models/Post');

// [GET] /posts - Lista todos os posts
const getAllPosts = async (req, res) => {
    try {
        const isProfessor = req.user?.role === 'professor';
        const query = isProfessor ? {} : { isActive: true };

        const posts = await Post.find(query).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar posts.' });
    }
};

// [GET] /posts/:id - Post por ID
const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const isProfessor = req.user?.role === 'professor';

        const filter = { _id: id };
        if (!isProfessor) {
            filter.isActive = true;
        }

        const post = await Post.findOne(filter);

        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }

        res.json(post);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar post.' });
    }
};

// [POST] /posts - Criar novo post
const createPost = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(401).json({ message: 'Acesso restrito a professores.' });
        }
        const { title, content, author, isActive, readTime, description, comments } = req.body;
        const newPost = new Post({ title, content, author, isActive, readTime, description, comments });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao criar post.' });
    }
};

// [PUT] /posts/:id - Atualizar post
const updatePost = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(401).json({ message: 'Acesso restrito a professores.' });
        }
        // Extrair apenas campos permitidos para atualização, ignorando comments
        const { title, content, author, isActive, readTime, description } = req.body;
        const { id } = req.params;
        const updated = await Post.findByIdAndUpdate(
            id,
            { title, content, author, updatedAt: Date.now(), isActive, readTime, description },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar post.' });
    }
};

// [DELETE] /posts/:id - Excluir post
const deletePost = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(401).json({ message: 'Acesso restrito a professores.' });
        }
        const deleted = await Post.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Post não encontrado.' });
        res.json({ message: 'Post excluído com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao deletar post.' });
    }
};

// [GET] /posts/search?q=termo - Busca
const searchPosts = async (req, res) => {
    try {
        // Permite acesso tanto para professores quanto para alunos
        if (req.user?.role !== 'professor' && req.user?.role !== 'aluno') {
            return res.status(401).json({ message: 'Acesso restrito a professores e alunos.' });
        }
        const query = req.query.q;
        const posts = await Post.find({
            $or: [
                { title: new RegExp(query, 'i') },
                { content: new RegExp(query, 'i') },
                { author: new RegExp(query, 'i') },
                { description: new RegExp(query, 'i') }
            ]
        });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'Erro na busca.' });
    }
};

// [POST] /posts/:id/comments - Adicionar comentário
const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
                
        // Extrair dados do JWT decodificado pelo middleware auth
        const { name: author, role } = req.user;

        
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }
        
        const newComment = {
            author,
            role,
            comment,
            createdAt: new Date()
        };
        
        post.comments.push(newComment);
        await post.save();
        
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao adicionar comentário.' });
    }
};

// [PUT] /posts/:id/comments/:commentId - Atualizar comentário
const updateComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { comment } = req.body;
        const { name: userName, role: userRole } = req.user;
        
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }
        
        const commentToUpdate = post.comments.id(commentId);
        if (!commentToUpdate) {
            return res.status(404).json({ message: 'Comentário não encontrado.' });
        }
        
        // Verificar se o usuário pode atualizar o comentário (apenas o autor)
        if (commentToUpdate.author !== userName || commentToUpdate.role !== userRole) {
            return res.status(403).json({ message: 'Você só pode atualizar seus próprios comentários.' });
        }
        
        commentToUpdate.comment = comment;
        await post.save();
        
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar comentário.' });
    }
};

// [DELETE] /posts/:id/comments/:commentId - Deletar comentário
const deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { name: userName, role: userRole } = req.user;
        
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }
        
        const commentToDelete = post.comments.id(commentId);
        if (!commentToDelete) {
            return res.status(404).json({ message: 'Comentário não encontrado.' });
        }
        
        // Regras de autorização para deletar comentários
        const canDelete = 
            // O autor pode deletar o próprio comentário
            (commentToDelete.author === userName && commentToDelete.role === userRole) ||
            // Professor pode deletar comentário de aluno
            (userRole === 'professor' && commentToDelete.role === 'aluno') ||
            // Professor pode deletar próprio comentário (já coberto pela primeira condição, mas deixando explícito)
            (userRole === 'professor' && commentToDelete.role === 'professor' && commentToDelete.author === userName);
        
        if (!canDelete) {
            return res.status(403).json({ message: 'Você não tem permissão para deletar este comentário.' });
        }
        
        post.comments.pull(commentId);
        await post.save();
        
        res.json({ message: 'Comentário deletado com sucesso.', post });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao deletar comentário.' });
    }
};

module.exports = {
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    searchPosts,
    addComment,
    updateComment,
    deleteComment,
};
