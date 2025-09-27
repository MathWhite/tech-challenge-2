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
const tokenAluno = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWx1bm8iLCJuYW1lIjoiUGVkcm8iLCJpYXQiOjE3NTkwMDI5MDd9.j11EStIjOvOBVOwg9FDcr-Fu4dzbETn1xIFjUd7Lip0';


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
        description: 'Uma descrição do post',
        comments: [{
          author: 'João',
          role: 'aluno',
          comment: 'Muito bom!'
        }]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Primeiro Post');
    expect(res.body.description).toBe('Uma descrição do post');
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].author).toBe('João');
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
      readTime: 5,
      description: 'Descrição do post',
      comments: []
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
    await Post.create({ title: 'A', content: 'B', author: 'M', isActive: true, description: 'Desc A', comments: [] });
    await Post.create({ title: 'C', content: 'D', author: 'N', isActive: false, description: 'Desc C', comments: [] });

    const res = await request(app).get('/posts').set('Authorization', `Bearer ${tokenProfessor}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('lista apenas os posts ativos (200)', async () => {
    await Post.create({ title: 'A', content: 'B', author: 'M', isActive: true, description: 'Desc A', comments: [] });
    await Post.create({ title: 'C', content: 'D', author: 'N', isActive: false, description: 'Desc C', comments: [] });

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
    const post = await Post.create({ 
      title: 'A', 
      content: 'B', 
      author: 'M', 
      description: 'Desc A', 
      comments: [{author: 'João', role: 'aluno', comment: 'Ótimo!'}] 
    });
    const res = await request(app).get(`/posts/${post._id}`).set('Authorization', `Bearer ${tokenProfessor}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(post.id);
    expect(res.body.description).toBe('Desc A');
    expect(res.body.comments).toHaveLength(1);
  });

  it('retorna 404 se id não existir', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/posts/${fakeId}`).set('Authorization', `Bearer ${tokenProfessor}`);
    expect(res.statusCode).toBe(404);
  });

  it('retorna 404 quando buscar por um id com isActive false (aluno)', async () => {
    const post = await Post.create({ 
      title: 'A', 
      content: 'B', 
      author: 'M', 
      isActive: false, 
      description: 'Desc A', 
      comments: [] 
    });
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
    const post = await Post.create({ 
      title: 'Old', 
      content: 'B', 
      author: 'M', 
      description: 'Desc Old', 
      comments: [] 
    });
    const res = await request(app)
      .put(`/posts/${post._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        title: 'Novo título',
        content: 'Conteúdo atualizado com mais de dez caracteres',
        author: 'Matheus',
        isActive: false,
        description: 'Nova descrição',
        comments: [{
          author: 'Pedro',
          comment: 'Comentário atualizado!'
        }]
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Novo título');
    expect(res.body.isActive).toBe(false);
    expect(res.body.description).toBe('Nova descrição');
    // Comments devem ser ignorados no PUT, então o array permanece vazio
    expect(res.body.comments).toHaveLength(0);
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
      readTime: 4,
      description: 'Nova descrição',
      comments: []
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
    const post = await Post.create({ 
      title: 'A', 
      content: 'B', 
      author: 'M', 
      description: 'Desc A', 
      comments: [] 
    });
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
    await Post.create({ 
      title: 'Node Rocks', 
      content: '...', 
      author: 'M', 
      description: 'Sobre Node.js', 
      comments: [] 
    });
    await Post.create({ 
      title: 'Outros', 
      content: 'Nada a ver', 
      author: 'M', 
      description: 'Outro assunto', 
      comments: [] 
    });

    const res = await request(app).get('/posts/search?q=node').set('Authorization', `Bearer ${tokenProfessor}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1); // Apenas um post contém 'node' no title
    expect(res.body[0].title).toMatch(/Node/i);
  });

  it('busca posts por description (200)', async () => {
    await Post.create({ 
      title: 'Primeiro Post', 
      content: 'Conteúdo qualquer', 
      author: 'M', 
      description: 'Este post fala sobre MongoDB', 
      comments: [] 
    });
    await Post.create({ 
      title: 'Segundo Post', 
      content: 'Outro conteúdo', 
      author: 'N', 
      description: 'Este post fala sobre Node.js', 
      comments: [] 
    });

    const res = await request(app).get('/posts/search?q=MongoDB').set('Authorization', `Bearer ${tokenProfessor}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].description).toMatch(/MongoDB/i);
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
/*  Testes para novos campos: description e comments                          */
/* -------------------------------------------------------------------------- */
describe('Novos campos - description e comments', () => {
  it('cria post apenas com description', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        title: 'Post com description',
        content: 'Conteúdo do post',
        author: 'Teste',
        description: 'Uma descrição bem detalhada'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.description).toBe('Uma descrição bem detalhada');
    expect(res.body.comments).toEqual([]);
  });

  it('cria post apenas com comments', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        title: 'Post com comments',
        content: 'Conteúdo do post',
        author: 'Teste',
        comments: [
          {
            author: 'João',
            role: 'aluno',
            comment: 'Primeiro comentário'
          },
          {
            author: 'Maria',
            role: 'professor',
            comment: 'Segundo comentário'
          }
        ]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.comments).toHaveLength(2);
    expect(res.body.comments[0].author).toBe('João');
    expect(res.body.comments[1].comment).toBe('Segundo comentário');
    expect(res.body.description).toBe('');
  });

  it('busca por description funciona corretamente', async () => {
    await Post.create({
      title: 'Post Teste',
      content: 'Conteúdo qualquer',
      author: 'Autor',
      description: 'MongoDB é fantástico'
    });

    const res = await request(app)
      .get('/posts/search?q=MongoDB')
      .set('Authorization', `Bearer ${tokenProfessor}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].description).toMatch(/MongoDB/i);
  });

  it('retorna erro 400 quando comments não é array', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        title: 'Post inválido',
        content: 'Conteúdo do post',
        author: 'Teste',
        comments: 'não é um array'
      });

    expect(res.statusCode).toBe(400);
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

/* -------------------------------------------------------------------------- */
/*  Testes para os novos endpoints de comentários                           */
/* -------------------------------------------------------------------------- */

describe('Endpoints de comentários', () => {
  let postId;

  beforeEach(async () => {
    await Post.deleteMany();
    const post = await Post.create({
      title: 'Post para comentários',
      content: 'Conteúdo do post',
      author: 'Autor Teste',
      description: 'Descrição para teste'
    });
    postId = post._id.toString();
  });

  /* -------------------------------------------------------------------------- */
  /*  POST /posts/:id/comments                                                */
  /* -------------------------------------------------------------------------- */

  describe('POST /posts/:id/comments', () => {
    it('deve adicionar comentário com sucesso - Professor', async () => {
      const res = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${tokenProfessor}`)
        .send({
          comment: 'Comentário de teste do professor'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0].author).toBe('Matheus');
      expect(res.body.comments[0].role).toBe('professor');
      expect(res.body.comments[0].comment).toBe('Comentário de teste do professor');
      expect(res.body.comments[0]).toHaveProperty('createdAt');
      expect(res.body.comments[0]).toHaveProperty('_id');
    });

    it('deve adicionar comentário com sucesso - Aluno', async () => {
      const res = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${tokenAluno}`)
        .send({
          comment: 'Comentário de teste do aluno'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0].author).toBe('Pedro');
      expect(res.body.comments[0].role).toBe('aluno');
      expect(res.body.comments[0].comment).toBe('Comentário de teste do aluno');
    });

    it('deve retornar 400 se comentário estiver vazio', async () => {
      const res = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${tokenProfessor}`)
        .send({
          comment: ''
        });

      expect(res.statusCode).toBe(400);
    });

    it('deve retornar 404 se post não existir', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/posts/${fakeId}/comments`)
        .set('Authorization', `Bearer ${tokenProfessor}`)
        .send({
          comment: 'Comentário de teste'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Post não encontrado.');
    });

    it('deve retornar 401 sem token', async () => {
      const res = await request(app)
        .post(`/posts/${postId}/comments`)
        .send({
          comment: 'Comentário de teste'
        });

      expect(res.statusCode).toBe(401);
    });

    it('deve retornar 500 se ocorrer erro interno ao adicionar comentário', async () => {
      // Mock do método save para gerar erro
      jest.spyOn(Post.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Erro simulado no save');
      });

      const res = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${tokenProfessor}`)
        .send({
          comment: 'Comentário de teste'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Erro ao adicionar comentário.');
    });
  });

  /* -------------------------------------------------------------------------- */
  /*  PUT /posts/:id/comments/:commentId                                       */
  /* -------------------------------------------------------------------------- */

  describe('PUT /posts/:id/comments/:commentId', () => {
    let commentId;

    beforeEach(async () => {
      // Adicionar um comentário primeiro
      const res = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${tokenProfessor}`)
        .send({
          comment: 'Comentário original'
        });
      commentId = res.body.comments[0]._id;
    });

    it('deve atualizar comentário próprio com sucesso', async () => {
      const res = await request(app)
        .put(`/posts/${postId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${tokenProfessor}`)
        .send({
          comment: 'Comentário atualizado'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.comments[0].comment).toBe('Comentário atualizado');
    });

    it('deve retornar 403 ao tentar atualizar comentário de outro usuário', async () => {
      const res = await request(app)
        .put(`/posts/${postId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${tokenAluno}`)
        .send({
          comment: 'Tentativa de atualização'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('Você só pode atualizar seus próprios comentários.');
    });

    it('deve retornar 404 se comentário não existir', async () => {
      const fakeCommentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/posts/${postId}/comments/${fakeCommentId}`)
        .set('Authorization', `Bearer ${tokenProfessor}`)
        .send({
          comment: 'Comentário atualizado'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Comentário não encontrado.');
    });

    it('deve retornar 404 se post não existir', async () => {
      const fakePostId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/posts/${fakePostId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${tokenProfessor}`)
        .send({
          comment: 'Comentário atualizado'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Post não encontrado.');
    });

    it('deve retornar 400 se comentário estiver vazio', async () => {
      const res = await request(app)
        .put(`/posts/${postId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${tokenProfessor}`)
        .send({
          comment: ''
        });

      expect(res.statusCode).toBe(400);
    });

    it('deve retornar 500 se ocorrer erro interno ao atualizar comentário', async () => {
      // Mock do método save para gerar erro
      jest.spyOn(Post.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Erro simulado no save');
      });

      const res = await request(app)
        .put(`/posts/${postId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${tokenProfessor}`)
        .send({
          comment: 'Comentário atualizado'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Erro ao atualizar comentário.');
    });
  });

  /* -------------------------------------------------------------------------- */
  /*  DELETE /posts/:id/comments/:commentId                                    */
  /* -------------------------------------------------------------------------- */

  describe('DELETE /posts/:id/comments/:commentId', () => {
    let professorCommentId;
    let alunoCommentId;

    beforeEach(async () => {
      // Adicionar comentário do professor
      const resProfessor = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${tokenProfessor}`)
        .send({
          comment: 'Comentário do professor'
        });
      professorCommentId = resProfessor.body.comments[0]._id;

      // Adicionar comentário do aluno
      const resAluno = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${tokenAluno}`)
        .send({
          comment: 'Comentário do aluno'
        });
      alunoCommentId = resAluno.body.comments[1]._id;
    });

    it('deve permitir que autor delete próprio comentário', async () => {
      const res = await request(app)
        .delete(`/posts/${postId}/comments/${professorCommentId}`)
        .set('Authorization', `Bearer ${tokenProfessor}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Comentário deletado com sucesso.');
      expect(res.body.post.comments).toHaveLength(1);
    });

    it('deve permitir que professor delete comentário de aluno', async () => {
      const res = await request(app)
        .delete(`/posts/${postId}/comments/${alunoCommentId}`)
        .set('Authorization', `Bearer ${tokenProfessor}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Comentário deletado com sucesso.');
    });

    it('deve impedir que aluno delete comentário de professor', async () => {
      const res = await request(app)
        .delete(`/posts/${postId}/comments/${professorCommentId}`)
        .set('Authorization', `Bearer ${tokenAluno}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('Você não tem permissão para deletar este comentário.');
    });

    it('deve impedir que professor delete comentário de outro professor', async () => {
      // Criar um token para outro professor
      const tokenOutroProfessor = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicHJvZmVzc29yIiwibmFtZSI6IkNhcmxvcyIsImlhdCI6MTc1OTAwNDQ5N30.HOS073-oEbGEmSbx48oXd-K91VrtZzgcb_Z88w91SPY';
      
      const res = await request(app)
        .delete(`/posts/${postId}/comments/${professorCommentId}`)
        .set('Authorization', `Bearer ${tokenOutroProfessor}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('Você não tem permissão para deletar este comentário.');
    });

    it('deve permitir que aluno delete próprio comentário', async () => {
      const res = await request(app)
        .delete(`/posts/${postId}/comments/${alunoCommentId}`)
        .set('Authorization', `Bearer ${tokenAluno}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Comentário deletado com sucesso.');
    });

    it('deve retornar 404 se comentário não existir', async () => {
      const fakeCommentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/posts/${postId}/comments/${fakeCommentId}`)
        .set('Authorization', `Bearer ${tokenProfessor}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Comentário não encontrado.');
    });

    it('deve retornar 404 se post não existir', async () => {
      const fakePostId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/posts/${fakePostId}/comments/${professorCommentId}`)
        .set('Authorization', `Bearer ${tokenProfessor}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Post não encontrado.');
    });

    it('deve retornar 500 se ocorrer erro interno ao deletar comentário', async () => {
      // Mock do método save para gerar erro
      jest.spyOn(Post.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Erro simulado no save');
      });

      const res = await request(app)
        .delete(`/posts/${postId}/comments/${professorCommentId}`)
        .set('Authorization', `Bearer ${tokenProfessor}`);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Erro ao deletar comentário.');
    });
  });

  /* -------------------------------------------------------------------------- */
  /*  Teste para verificar se PUT /posts/:id ignora comments                   */
  /* -------------------------------------------------------------------------- */

  describe('PUT /posts/:id - deve ignorar comments', () => {
    it('deve ignorar campo comments no PUT', async () => {
      // Primeiro, criar um post com um comentário
      const postWithComment = await Post.create({
        title: 'Post original',
        content: 'Conteúdo original',
        author: 'Autor original',
        comments: [{
          author: 'Comentarista',
          role: 'aluno',
          comment: 'Comentário existente'
        }]
      });

      const res = await request(app)
        .put(`/posts/${postWithComment._id}`)
        .set('Authorization', `Bearer ${tokenProfessor}`)
        .send({
          title: 'Post atualizado',
          content: 'Conteúdo atualizado',
          author: 'Autor atualizado',
          comments: [] // Tentando limpar os comments - deve ser ignorado
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Post atualizado');
      expect(res.body.content).toBe('Conteúdo atualizado');
      expect(res.body.author).toBe('Autor atualizado');
      // Os comments originais devem ser preservados
      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0].comment).toBe('Comentário existente');
    });
  });

});

