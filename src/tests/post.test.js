const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');

const postRoutes = require('../routes/postRoutes');
const Post = require('../models/Post');

let app;
let mongoServer;


/* -------------------------------------------------------------------------- */
/*  Define os Tokens                                                          */
/* -------------------------------------------------------------------------- */

process.env.JWT_SECRET = 'secreta123';
const tokenProfessor = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicHJvZmVzc29yIiwibmFtZSI6Ik1hdGhldXMiLCJpYXQiOjE3NTI2NjgzMzZ9.BQUrflZw8QktIBmqOVWiPvu0jDowJl_-SiBr9yCyPv0';
const tokenAluno = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWx1bm8iLCJuYW1lIjoiTWF0aGV1cyIsImlhdCI6MTc1MjY2ODMzNn0.G6i94pkpNQQ5o-7pLpmNdSMbj1FfWpoBYn2U0oMBusU';


/* -------------------------------------------------------------------------- */
/*  Setup global                                                               */
/* -------------------------------------------------------------------------- */
beforeAll(async () => {
  // Sobe MongoDB em memória
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Conecta o Mongoose
  await mongoose.connect(uri);

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
  jest.restoreAllMocks();
});

/* -------------------------------------------------------------------------- */
/*  POST /posts                                                                */
/* -------------------------------------------------------------------------- */
describe('POST /posts', () => {
  it('cria um post válido (201)', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        title: 'Primeiro Post',
        content: 'Conteúdo qualquer',
        author: 'Matheus',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Primeiro Post');
  });

  it('retorna 400 quando faltar campo obrigatório', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        content: 'Sem título',
        author: 'Matheus',
      });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 401 quando faltar token', async () => {
    const res = await request(app)
      .post('/posts')
      .send({
        content: 'Sem título',
        author: 'Matheus',
      });
    expect(res.statusCode).toBe(401);
  });

  it('retorna 401 quando for um token de aluno', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send({
        title: 'Primeiro Post',
        content: 'Conteúdo qualquer',
        author: 'Matheus',
      });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Acesso restrito a professores./i);
  });

  it('retorna 500 se der erro interno ao criar post', async () => {
    // Mock do método save da instância do Post
    jest.spyOn(Post.prototype, 'save').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const newPostData = {
      title: 'Novo Post',
      content: 'Conteúdo do post',
      author: 'Autor',
      isActive: true,
      readTime: 5
    };

    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send(newPostData);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Erro ao criar post/i);

  });
});

/* -------------------------------------------------------------------------- */
/*  GET /posts                                                                 */
/* -------------------------------------------------------------------------- */
describe('GET /posts', () => {
  it('lista todos os posts (200)', async () => {
    await Post.create({ title: 'A', content: 'B', author: 'M', isActive: true });
    await Post.create({ title: 'C', content: 'D', author: 'N', isActive: false });

    const res = await request(app).get('/posts').set('Authorization', `Bearer ${tokenProfessor}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('lista apenas os posts ativos (200)', async () => {
    await Post.create({ title: 'A', content: 'B', author: 'M', isActive: true });
    await Post.create({ title: 'C', content: 'D', author: 'N', isActive: false });

    const res = await request(app).get('/posts').set('Authorization', `Bearer ${tokenAluno}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('retorna 401 quando faltar token', async () => {
    const res = await request(app).get('/posts');
    expect(res.statusCode).toBe(401);
  });

  it('retorna 500 quando der no get all', async () => {
    jest.spyOn(Post, 'find').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const res = await request(app).get('/posts').set('Authorization', `Bearer ${tokenAluno}`);
    expect(res.statusCode).toBe(500);
  });

});

/* -------------------------------------------------------------------------- */
/*  GET /posts/:id                                                             */
/* -------------------------------------------------------------------------- */
describe('GET /posts/:id', () => {
  it('retorna um post existente (200)', async () => {
    const post = await Post.create({ title: 'A', content: 'B', author: 'M' });
    const res = await request(app).get(`/posts/${post._id}`).set('Authorization', `Bearer ${tokenProfessor}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(post.id);
  });

  it('retorna 404 se id não existir', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/posts/${fakeId}`).set('Authorization', `Bearer ${tokenProfessor}`);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 404 quando buscar por um id com isActive false (aluno)', async () => {
    const post = await Post.create({ title: 'A', content: 'B', author: 'M', isActive: false });
    const res = await request(app).get(`/posts/${post._id}`).set('Authorization', `Bearer ${tokenAluno}`);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 401 quando faltar token', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/posts/${fakeId}`);
    expect(res.statusCode).toBe(401);
  });

  it('retorna 500 se der erro no get by Id', async () => {
    const spy = jest.spyOn(Post, 'findOne').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const id = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/posts/${id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Erro ao buscar post/i);

    spy.mockRestore();
  });


});

/* -------------------------------------------------------------------------- */
/*  PUT /posts/:id                                                             */
/* -------------------------------------------------------------------------- */
describe('PUT /posts/:id', () => {
  it('atualiza post existente (200)', async () => {
    const post = await Post.create({ title: 'Old', content: 'B', author: 'M' });
    const res = await request(app)
      .put(`/posts/${post._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        title: 'Novo título',
        content: 'Conteúdo atualizado com mais de dez caracteres',
        author: 'Matheus',
        isActive: false
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Novo título');
    expect(res.body.isActive).toBe(false);
  });

  it('retorna 404 ao atualizar id inexistente', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/posts/${fakeId}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        title: 'Título inexistente',
        content: 'CAlgum conteúdo válido aqui',
        author: 'Autor XPTO',
      });
    expect(res.statusCode).toBe(404);
  });

  it('retorna 401 quando faltar token', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).put(`/posts/${fakeId}`);
    expect(res.statusCode).toBe(401);
  });

  it('retorna 401 quando for um token de aluno', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/posts/${fakeId}`)
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send({
        title: 'Primeiro Post',
        content: 'Conteúdo qualquer',
        author: 'Matheus',
      });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Acesso restrito a professores./i);
  });
  it('retorna 500 se der erro interno ao atualizar post', async () => {
    // Mock do método estático findByIdAndUpdate
    jest.spyOn(Post, 'findByIdAndUpdate').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const postId = new mongoose.Types.ObjectId();

    const updatedPostData = {
      title: 'Post Atualizado',
      content: 'Novo conteúdo',
      author: 'Autor',
      isActive: true,
      readTime: 4
    };

    const res = await request(app)
      .put(`/posts/${postId}`) // <-- Corrigido: rota com ID
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send(updatedPostData);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Erro ao atualizar post/i);
  });

});

/* -------------------------------------------------------------------------- */
/*  DELETE /posts/:id                                                          */
/* -------------------------------------------------------------------------- */
describe('DELETE /posts/:id', () => {
  it('deleta post existente (200)', async () => {
    const post = await Post.create({ title: 'A', content: 'B', author: 'M' });
    const res = await request(app).delete(`/posts/${post._id}`).set('Authorization', `Bearer ${tokenProfessor}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/excluído/);
  });

  it('retorna 404 ao deletar id inexistente', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/posts/${fakeId}`).set('Authorization', `Bearer ${tokenProfessor}`);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 401 quando faltar token', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/posts/${fakeId}`);
    expect(res.statusCode).toBe(401);
  });

  it('retorna 401 quando for um token de aluno', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/posts/${fakeId}`).set('Authorization', `Bearer ${tokenAluno}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Acesso restrito a professores./i);
  });

  it('retorna 500 se der erro interno ao deletar post', async () => {
    // Mock do método estático findByIdAndUpdate
    jest.spyOn(Post, 'findByIdAndDelete').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const postId = new mongoose.Types.ObjectId();

    const res = await request(app).delete(`/posts/${postId}`).set('Authorization', `Bearer ${tokenProfessor}`);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Erro ao deletar post/i);
  });

});

/* -------------------------------------------------------------------------- */
/*  GET /posts/search                                                          */
/* -------------------------------------------------------------------------- */
describe('GET /posts/search?q=', () => {
  it('busca posts por termo (200)', async () => {
    await Post.create({ title: 'Node Rocks', content: '...', author: 'M' });
    await Post.create({ title: 'Outros', content: 'Nada a ver', author: 'M' });

    const res = await request(app).get('/posts/search?q=node').set('Authorization', `Bearer ${tokenProfessor}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toMatch(/Node/i);
  });

  it('retorna lista vazia quando não encontra', async () => {
    const res = await request(app).get('/posts/search?q=semresultado').set('Authorization', `Bearer ${tokenProfessor}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('retorna 401 quando faltar token', async () => {
    const res = await request(app).get('/posts/search?q=semresultado');
    expect(res.statusCode).toBe(401);
  });

  it('retorna 401 quando for um token de aluno', async () => {
    const res = await request(app).get('/posts/search?q=semresultado').set('Authorization', `Bearer ${tokenAluno}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Acesso restrito a professores./i);
  });

  it('retorna 500 se der erro interno na busca de posts', async () => {
    jest.spyOn(Post, 'find').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const res = await request(app)
      .get('/posts/search?q=teste')
      .set('Authorization', `Bearer ${tokenProfessor}`);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Erro na busca/i);
  });

});


/* -------------------------------------------------------------------------- */
/*  Middleware e catch                                                       */
/* -------------------------------------------------------------------------- */

describe('Middleware de autenticação e catch de erros', () => {
  it('retorna 401 se token inválido', async () => {
    const invalidToken = 'Bearer token.invalido.aqui';

    const res = await request(app)
      .get('/posts')
      .set('Authorization', invalidToken);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Token inválido.');
  });

  it('retorna 401 se nenhum token for fornecido', async () => {
    const res = await request(app).get('/posts');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Token não fornecido.');
  });

});

