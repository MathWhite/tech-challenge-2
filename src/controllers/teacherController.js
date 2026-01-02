const Teacher = require('../models/Teacher');
const bcrypt = require('bcrypt');

// [GET] /teachers - Lista todos os professores
const getAllTeachers = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(403).json({ message: 'Acesso restrito a professores.' });
        }

        const teachers = await Teacher.find().select('-password').sort({ createdAt: -1 });
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar professores.' });
    }
};

// [GET] /teachers/:id - Professor por ID
const getTeacherById = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(403).json({ message: 'Acesso restrito a professores.' });
        }

        const { id } = req.params;
        const teacher = await Teacher.findById(id).select('-password');

        if (!teacher) {
            return res.status(404).json({ message: 'Professor não encontrado.' });
        }

        res.json(teacher);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar professor.' });
    }
};

// [POST] /teachers - Criar novo professor
const createTeacher = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(403).json({ message: 'Acesso restrito a professores.' });
        }

        const { name, email, password, status } = req.body;

        // Verificar se o email já existe
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ message: 'Email já cadastrado.' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        const newTeacher = new Teacher({
            name,
            email,
            password: hashedPassword,
            status: status || 'ativo',
            role: 'professor'
        });

        await newTeacher.save();

        // Retornar sem a senha
        const teacherResponse = newTeacher.toObject();
        delete teacherResponse.password;

        res.status(201).json(teacherResponse);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao criar professor.' });
    }
};

// [PUT] /teachers/:id - Atualizar professor
const updateTeacher = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(403).json({ message: 'Acesso restrito a professores.' });
        }

        const { id } = req.params;
        const { name, email, password, status } = req.body;

        const teacher = await Teacher.findById(id);
        if (!teacher) {
            return res.status(404).json({ message: 'Professor não encontrado.' });
        }

        // Verificar se o email já está em uso por outro professor
        if (email && email !== teacher.email) {
            const existingTeacher = await Teacher.findOne({ email });
            if (existingTeacher) {
                return res.status(400).json({ message: 'Email já cadastrado.' });
            }
        }

        // Atualizar campos
        if (name) teacher.name = name;
        if (email) teacher.email = email;
        if (status) teacher.status = status;
        if (password) {
            teacher.password = await bcrypt.hash(password, 10);
        }
        teacher.updatedAt = Date.now();

        await teacher.save();

        // Retornar sem a senha
        const teacherResponse = teacher.toObject();
        delete teacherResponse.password;

        res.json(teacherResponse);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar professor.' });
    }
};

// [DELETE] /teachers/:id - Excluir professor
const deleteTeacher = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(403).json({ message: 'Acesso restrito a professores.' });
        }

        const deleted = await Teacher.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Professor não encontrado.' });
        }

        res.json({ message: 'Professor excluído com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao deletar professor.' });
    }
};

module.exports = {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
};
