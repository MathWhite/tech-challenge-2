require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');

const seedPosts = [
  {
    title: 'Introdução ao Node.js',
    content: 'Node.js é um runtime JavaScript poderoso baseado no V8.',
    author: 'Matheus',
    description: 'Uma introdução completa ao Node.js e suas funcionalidades',
    comments: [
      {
        author: 'João',
        comment: 'Excelente explicação!'
      }
    ]
  },
  {
    title: 'Por que usar MongoDB?',
    content: 'MongoDB é um banco de dados NoSQL flexível e escalável.',
    author: 'João',
    description: 'Explorando as vantagens do MongoDB em projetos modernos',
    comments: [
      {
        author: 'Maria',
        comment: 'MongoDB é realmente muito bom!'
      },
      {
        author: 'Pedro',
        comment: 'Interessante, vou testar!'
      }
    ]
  },
  {
    title: 'Testes com Jest',
    content: 'Jest é uma biblioteca incrível para testes em JavaScript.',
    author: 'Maria',
    description: 'Como implementar testes eficientes com Jest',
    comments: []
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Conectado ao MongoDB');

    await Post.deleteMany(); // limpa
    await Post.insertMany(seedPosts); // insere

    console.log('✅ Seed inserido com sucesso!');
    process.exit();
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  }
}

seed();
