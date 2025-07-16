const Post = require('../models/Post');

// [GET] /posts - Lista todos os posts
const getAllPosts = async (req, res) => {
    try {
        const isProfessor = req.user?.role === 'professor';
        const query = isProfessor ? {} : { isActive: true };
        console.log('Usuário autenticado:', req.user);

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
        const { title, content, author, isActive, readTime } = req.body;
        const newPost = new Post({ title, content, author, isActive, readTime });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao criar post.' });
    }
};

// [PUT] /posts/:id - Atualizar post
const updatePost = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(401).json({ message: 'Acesso restrito a professores.' });
        }
        const { title, content, author, isActive, readTime } = req.body;
        const { id } = req.params;

        console.log('🧪 Recebido:', { id, title, content, author, isActive, readTime });

        const updated = await Post.findByIdAndUpdate(
            id,
            { title, content, author, updatedAt: Date.now(), isActive, readTime },
            { new: true }
        );

        if (!updated) {
            console.warn('⚠️ Post não encontrado para o ID:', id);
            return res.status(404).json({ message: 'Post não encontrado.' });
        }

        console.log('✅ Post atualizado:', updated);
        res.json(updated);

    } catch (err) {
        console.error('❌ Erro no update:', err.message);
        res.status(400).json({ message: 'Erro ao atualizar post.' });
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
        if (req.user?.role !== 'professor') {
            return res.status(401).json({ message: 'Acesso restrito a professores.' });
        }
        const query = req.query.q;
        const posts = await Post.find({
            $or: [
                { title: new RegExp(query, 'i') },
                { content: new RegExp(query, 'i') },
                { author: new RegExp(query, 'i') }
            ]
        });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'Erro na busca.' });
    }
};

module.exports = {
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    searchPosts,
};
