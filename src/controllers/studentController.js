const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const bcrypt = require('bcrypt');

// [GET] /students - Lista todos os alunos
const getAllStudents = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(403).json({ message: 'Acesso restrito a professores.' });
        }

        const students = await Student.find().select('-password').sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar alunos.' });
    }
};

// [GET] /students/:id - Aluno por ID
const getStudentById = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(403).json({ message: 'Acesso restrito a professores.' });
        }

        const { id } = req.params;
        const student = await Student.findById(id).select('-password');

        if (!student) {
            return res.status(404).json({ message: 'Aluno não encontrado.' });
        }

        res.json(student);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar aluno.' });
    }
};

// [POST] /students - Criar novo aluno
const createStudent = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(403).json({ message: 'Acesso restrito a professores.' });
        }

        const { name, email, password, isActive } = req.body;

        // Verificar se o email já existe em Student ou Teacher
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
            return res.status(400).json({ message: 'Email já cadastrado.' });
        }

        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ message: 'Email já cadastrado.' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        const newStudent = new Student({
            name,
            email,
            password: hashedPassword,
            isActive: isActive !== undefined ? isActive : true,
            role: 'aluno'
        });

        await newStudent.save();

        // Retornar sem a senha
        const studentResponse = newStudent.toObject();
        delete studentResponse.password;

        res.status(201).json(studentResponse);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao criar aluno.' });
    }
};

// [PUT] /students/:id - Atualizar aluno
const updateStudent = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(403).json({ message: 'Acesso restrito a professores.' });
        }

        const { id } = req.params;
        const { name, email, password, isActive } = req.body;

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ message: 'Aluno não encontrado.' });
        }

        // Email é imutável - não pode ser alterado
        if (email && email !== student.email) {
            return res.status(400).json({ message: 'Email não pode ser alterado.' });
        }

        // Atualizar campos
        if (name) student.name = name;
        if (isActive !== undefined) student.isActive = isActive;
        if (password) {
            student.password = await bcrypt.hash(password, 10);
        }
        student.updatedAt = Date.now();

        await student.save();

        // Retornar sem a senha
        const studentResponse = student.toObject();
        delete studentResponse.password;

        res.json(studentResponse);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar aluno.' });
    }
};

// [DELETE] /students/:id - Excluir aluno
const deleteStudent = async (req, res) => {
    try {
        if (req.user?.role !== 'professor') {
            return res.status(403).json({ message: 'Acesso restrito a professores.' });
        }

        const deleted = await Student.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Aluno não encontrado.' });
        }

        res.json({ message: 'Aluno excluído com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao deletar aluno.' });
    }
};

module.exports = {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
};
