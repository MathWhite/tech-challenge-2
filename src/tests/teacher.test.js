const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const bcrypt = require('bcrypt');

const teacherRoutes = require('../routes/teacherRoutes');
const Teacher = require('../models/Teacher');

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
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use('/teachers', teacherRoutes);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await Teacher.deleteMany({});
  jest.restoreAllMocks();
});

/* -------------------------------------------------------------------------- */
/*  POST /teachers                                                             */
/* -------------------------------------------------------------------------- */
describe('POST /teachers', () => {
  it('cria um professor válido (201)', async () => {
    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'João Silva',
        email: 'joao.silva@escola.com',
        password: 'senha123',
        status: 'ativo'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('João Silva');
    expect(res.body.email).toBe('joao.silva@escola.com');
    expect(res.body.role).toBe('professor');
    expect(res.body.status).toBe('ativo');
    expect(res.body).not.toHaveProperty('password'); // Senha não deve retornar
  });

  it('retorna 400 quando faltar campo obrigatório (nome)', async () => {
    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        email: 'teste@escola.com',
        password: 'senha123'
      });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 quando faltar campo obrigatório (email)', async () => {
    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'João Silva',
        password: 'senha123'
      });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 quando faltar campo obrigatório (password)', async () => {
    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'João Silva',
        email: 'joao@escola.com'
      });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 quando email for inválido', async () => {
    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'João Silva',
        email: 'email-invalido',
        password: 'senha123'
      });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 quando senha for menor que 6 caracteres', async () => {
    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'João Silva',
        email: 'joao@escola.com',
        password: '12345'
      });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 quando email já estiver cadastrado', async () => {
    await Teacher.create({
      name: 'Maria',
      email: 'duplicado@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'João Silva',
        email: 'duplicado@escola.com',
        password: 'senha123'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Email já cadastrado/i);
  });

  it('retorna 401 quando faltar token', async () => {
    const res = await request(app)
      .post('/teachers')
      .send({
        name: 'João Silva',
        email: 'joao@escola.com',
        password: 'senha123'
      });
    expect(res.statusCode).toBe(401);
  });

  it('retorna 403 quando for um token de aluno', async () => {
    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send({
        name: 'João Silva',
        email: 'joao@escola.com',
        password: 'senha123'
      });
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Acesso restrito a professores/i);
  });

  it('retorna 500 se der erro interno ao criar professor', async () => {
    jest.spyOn(Teacher.prototype, 'save').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'João Silva',
        email: 'joao@escola.com',
        password: 'senha123'
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Erro ao criar professor/i);
  });
});

/* -------------------------------------------------------------------------- */
/*  GET /teachers                                                              */
/* -------------------------------------------------------------------------- */
describe('GET /teachers', () => {
  it('lista todos os professores (200)', async () => {
    await Teacher.create({
      name: 'Professor A',
      email: 'profa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      status: 'ativo'
    });
    await Teacher.create({
      name: 'Professor B',
      email: 'profb@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      status: 'inativo'
    });

    const res = await request(app)
      .get('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).not.toHaveProperty('password');
  });

  it('retorna 401 quando faltar token', async () => {
    const res = await request(app).get('/teachers');
    expect(res.statusCode).toBe(401);
  });

  it('retorna 403 quando for token de aluno', async () => {
    const res = await request(app)
      .get('/teachers')
      .set('Authorization', `Bearer ${tokenAluno}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Acesso restrito a professores/i);
  });

  it('retorna 500 quando der erro no get all', async () => {
    jest.spyOn(Teacher, 'find').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const res = await request(app)
      .get('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`);
    
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Erro ao buscar professores/i);
  });
});

/* -------------------------------------------------------------------------- */
/*  GET /teachers/:id                                                          */
/* -------------------------------------------------------------------------- */
describe('GET /teachers/:id', () => {
  it('retorna um professor existente (200)', async () => {
    const teacher = await Teacher.create({
      name: 'Professor A',
      email: 'profa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      status: 'ativo'
    });

    const res = await request(app)
      .get(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(teacher.id);
    expect(res.body.name).toBe('Professor A');
    expect(res.body).not.toHaveProperty('password');
  });

  it('retorna 404 se id não existir', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/teachers/${fakeId}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/Professor não encontrado/i);
  });

  it('retorna 401 quando faltar token', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/teachers/${fakeId}`);
    expect(res.statusCode).toBe(401);
  });

  it('retorna 403 quando for token de aluno', async () => {
    const teacher = await Teacher.create({
      name: 'Professor A',
      email: 'profa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    const res = await request(app)
      .get(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenAluno}`);
    
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Acesso restrito a professores/i);
  });

  it('retorna 500 quando der erro no get by id', async () => {
    jest.spyOn(Teacher, 'findById').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/teachers/${fakeId}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);
    
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Erro ao buscar professor/i);
  });
});

/* -------------------------------------------------------------------------- */
/*  PUT /teachers/:id                                                          */
/* -------------------------------------------------------------------------- */
describe('PUT /teachers/:id', () => {
  it('atualiza um professor existente (200)', async () => {
    const teacher = await Teacher.create({
      name: 'Professor Original',
      email: 'original@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      status: 'ativo'
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Professor Atualizado',
        status: 'inativo'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Professor Atualizado');
    expect(res.body.status).toBe('inativo');
    expect(res.body).not.toHaveProperty('password');
  });

  it('atualiza apenas o nome', async () => {
    const teacher = await Teacher.create({
      name: 'Professor Original',
      email: 'original@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Novo Nome'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Novo Nome');
    expect(res.body.email).toBe('original@escola.com');
  });

  it('atualiza a senha', async () => {
    const teacher = await Teacher.create({
      name: 'Professor Original',
      email: 'original@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        password: 'novaSenha123'
      });

    expect(res.statusCode).toBe(200);
    
    // Verificar se a senha foi realmente atualizada (hash diferente)
    const updatedTeacher = await Teacher.findById(teacher._id);
    const isMatch = await bcrypt.compare('novaSenha123', updatedTeacher.password);
    expect(isMatch).toBe(true);
  });

  it('retorna 404 se professor não existir', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/teachers/${fakeId}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Novo Nome'
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/Professor não encontrado/i);
  });

  it('retorna 400 quando email já está em uso', async () => {
    await Teacher.create({
      name: 'Professor A',
      email: 'existente@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    const teacher = await Teacher.create({
      name: 'Professor B',
      email: 'outro@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        email: 'existente@escola.com'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Email já cadastrado/i);
  });

  it('retorna 401 quando faltar token', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/teachers/${fakeId}`)
      .send({ name: 'Novo Nome' });
    expect(res.statusCode).toBe(401);
  });

  it('retorna 403 quando for token de aluno', async () => {
    const teacher = await Teacher.create({
      name: 'Professor A',
      email: 'profa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send({ name: 'Novo Nome' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Acesso restrito a professores/i);
  });

  it('retorna 500 quando der erro no update', async () => {
    const teacher = await Teacher.create({
      name: 'Professor A',
      email: 'profa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    jest.spyOn(Teacher, 'findById').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({ name: 'Novo Nome' });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Erro ao atualizar professor/i);
  });
});

/* -------------------------------------------------------------------------- */
/*  DELETE /teachers/:id                                                       */
/* -------------------------------------------------------------------------- */
describe('DELETE /teachers/:id', () => {
  it('deleta um professor existente (200)', async () => {
    const teacher = await Teacher.create({
      name: 'Professor A',
      email: 'profa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    const res = await request(app)
      .delete(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Professor excluído com sucesso/i);

    // Verificar se foi realmente deletado
    const deletedTeacher = await Teacher.findById(teacher._id);
    expect(deletedTeacher).toBeNull();
  });

  it('retorna 404 se professor não existir', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/teachers/${fakeId}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/Professor não encontrado/i);
  });

  it('retorna 401 quando faltar token', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/teachers/${fakeId}`);
    expect(res.statusCode).toBe(401);
  });

  it('retorna 403 quando for token de aluno', async () => {
    const teacher = await Teacher.create({
      name: 'Professor A',
      email: 'profa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    const res = await request(app)
      .delete(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenAluno}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Acesso restrito a professores/i);
  });

  it('retorna 500 quando der erro no delete', async () => {
    jest.spyOn(Teacher, 'findByIdAndDelete').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/teachers/${fakeId}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Erro ao deletar professor/i);
  });
});
