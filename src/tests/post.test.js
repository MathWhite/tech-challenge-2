/**
 * Testes completos da API /posts
 * Usa mongodb-memory-server para rodar MongoDB em memória.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');

const postRoutes = require('../routes/postRoutes');
const Post = require('../models/Post');

let app;
let mongoServer;

/* -------------------------------------------------------------------------- */
/*  Setup global                                                               */
/* -------------------------------------------------------------------------- */
beforeAll(async () => {
  // Sobe MongoDB em memória
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Conecta o Mongoose
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Cria app Express isolado para testes
  app = express();
  app.use(express.json());
  app.use('/posts', postRoutes);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  // Limpa a base após cada teste
  await Post.deleteMany({});
});

/* -------------------------------------------------------------------------- */
/*  POST /posts                                                                */
/* -------------------------------------------------------------------------- */
describe('POST /posts', () => {
  it('cria um post válido (201)', async () => {
    const res = await request(app).post('/posts').send({
      title: 'Primeiro Post',
      content: 'Conteúdo qualquer',
      author: 'Matheus',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Primeiro Post');
  });

  it('retorna 400 quando faltar campo obrigatório', async () => {
    const res = await request(app).post('/posts').send({
      content: 'Sem título',
      author: 'Matheus',
    });
    expect(res.statusCode).toBe(400);
  });
});

/* -------------------------------------------------------------------------- */
/*  GET /posts                                                                 */
/* -------------------------------------------------------------------------- */
describe('GET /posts', () => {
  it('lista todos os posts (200)', async () => {
    await Post.create({ title: 'A', content: 'B', author: 'M' });
    await Post.create({ title: 'C', content: 'D', author: 'N' });

    const res = await request(app).get('/posts');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });
});

/* -------------------------------------------------------------------------- */
/*  GET /posts/:id                                                             */
/* -------------------------------------------------------------------------- */
describe('GET /posts/:id', () => {
  it('retorna um post existente (200)', async () => {
    const post = await Post.create({ title: 'A', content: 'B', author: 'M' });
    const res = await request(app).get(`/posts/${post._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(post.id);
  });

  it('retorna 404 se id não existir', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/posts/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });
});

/* -------------------------------------------------------------------------- */
/*  PUT /posts/:id                                                             */
/* -------------------------------------------------------------------------- */
describe('PUT /posts/:id', () => {
  it('atualiza post existente (200)', async () => {
    const post = await Post.create({ title: 'Old', content: 'B', author: 'M' });
    const res = await request(app).put(`/posts/${post._id}`).send({
      title: 'Novo título',
      content: 'Conteúdo atualizado com mais de dez caracteres',
      author: 'Matheus',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('New');
  });

  it('retorna 404 ao atualizar id inexistente', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).put(`/posts/${fakeId}`).send({
      title: 'Título inexistente',
      content: 'CAlgum conteúdo válido aqui',
      author: 'Autor XPTO',
    });
    expect(res.statusCode).toBe(404);
  });
});

/* -------------------------------------------------------------------------- */
/*  DELETE /posts/:id                                                          */
/* -------------------------------------------------------------------------- */
describe('DELETE /posts/:id', () => {
  it('deleta post existente (200)', async () => {
    const post = await Post.create({ title: 'A', content: 'B', author: 'M' });
    const res = await request(app).delete(`/posts/${post._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/excluído/);
  });

  it('retorna 404 ao deletar id inexistente', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/posts/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });
});

/* -------------------------------------------------------------------------- */
/*  GET /posts/search                                                          */
/* -------------------------------------------------------------------------- */
describe('GET /posts/search?q=', () => {
  it('busca posts por termo (200)', async () => {
    await Post.create({ title: 'Node Rocks', content: '...', author: 'M' });
    await Post.create({ title: 'Outros', content: 'Nada a ver', author: 'M' });

    const res = await request(app).get('/posts/search?q=node');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toMatch(/Node/i);
  });

  it('retorna lista vazia quando não encontra', async () => {
    const res = await request(app).get('/posts/search?q=semresultado');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});
