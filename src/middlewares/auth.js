const jwt = require('jsonwebtoken');

const auth = () => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Espera "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Salva o payload do token no req.user
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido.' });
  }
};

module.exports = auth;
