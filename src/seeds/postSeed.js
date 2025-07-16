require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');

const seedPosts = [
  {
    title: 'Introdução ao Node.js',
    content: 'Node.js é um runtime JavaScript poderoso baseado no V8.',
    author: 'Matheus',
  },
  {
    title: 'Por que usar MongoDB?',
    content: 'MongoDB é um banco de dados NoSQL flexível e escalável.',
    author: 'João',
  },
  {
    title: 'Testes com Jest',
    content: 'Jest é uma biblioteca incrível para testes em JavaScript.',
    author: 'Maria',
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
