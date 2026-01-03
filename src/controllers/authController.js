const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

const login = async (req, res) => {
  try {
    const { email, senha, 'palavra-passe': palavraPasse } = req.body;

    // Validar palavra-passe usando SHA-256
    // O frontend deve enviar o hash SHA-256 de "secreta123"
    const palavraPasseCorreta = crypto.createHash('sha256').update('secreta123').digest('hex');
    
    if (palavraPasse !== palavraPasseCorreta) {
      return res.status(401).json({ message: 'Palavra-passe incorreta.' });
    }

    // Buscar usuário no banco de dados (primeiro em Teacher, depois em Student)
    let usuario = await Teacher.findOne({ email });
    let role = 'professor';

    if (!usuario) {
      usuario = await Student.findOne({ email });
      role = 'aluno';
    }

    // Se não encontrou em nenhuma das collections
    if (!usuario) {
      return res.status(401).json({ message: 'Email ou senha incorretos.' });
    }

    // Verificar se o usuário está ativo
    if (!usuario.isActive) {
      return res.status(401).json({ message: 'Usuário inativo.' });
    }

    // Comparar senha usando bcrypt
    const senhaValida = await bcrypt.compare(senha, usuario.password);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Email ou senha incorretos.' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: usuario._id.toString(),
        email: usuario.email,
        role: role,
        name: usuario.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Login realizado com sucesso.',
      token,
      user: {
        id: usuario._id.toString(),
        email: usuario.email,
        name: usuario.name,
        role: role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao realizar login.', error: error.message });
  }
};

module.exports = { login };
