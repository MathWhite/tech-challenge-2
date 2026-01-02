const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const bcrypt = require('bcrypt');

const studentRoutes = require('../routes/studentRoutes');
const Student = require('../models/Student');

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
  app.use('/students', studentRoutes);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await Student.deleteMany({});
  jest.restoreAllMocks();
});

/* -------------------------------------------------------------------------- */
/*  POST /students                                                             */
/* -------------------------------------------------------------------------- */
describe('POST /students', () => {
  it('cria um aluno válido (201)', async () => {
    const res = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Maria Santos',
        email: 'maria.santos@escola.com',
        password: 'senha123',
        status: 'ativo'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('Maria Santos');
    expect(res.body.email).toBe('maria.santos@escola.com');
    expect(res.body.role).toBe('aluno');
    expect(res.body.status).toBe('ativo');
    expect(res.body).not.toHaveProperty('password'); // Senha não deve retornar
  });

  it('retorna 400 quando faltar campo obrigatório (nome)', async () => {
    const res = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        email: 'teste@escola.com',
        password: 'senha123'
      });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 quando faltar campo obrigatório (email)', async () => {
    const res = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Maria Santos',
        password: 'senha123'
      });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 quando faltar campo obrigatório (password)', async () => {
    const res = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Maria Santos',
        email: 'maria@escola.com'
      });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 quando email for inválido', async () => {
    const res = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Maria Santos',
        email: 'email-invalido',
        password: 'senha123'
      });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 quando senha for menor que 6 caracteres', async () => {
    const res = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Maria Santos',
        email: 'maria@escola.com',
        password: '12345'
      });
    expect(res.statusCode).toBe(400);
  });

  it('retorna 400 quando email já estiver cadastrado', async () => {
    await Student.create({
      name: 'Pedro',
      email: 'duplicado@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno'
    });

    const res = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Maria Santos',
        email: 'duplicado@escola.com',
        password: 'senha123'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Email já cadastrado/i);
  });

  it('retorna 401 quando faltar token', async () => {
    const res = await request(app)
      .post('/students')
      .send({
        name: 'Maria Santos',
        email: 'maria@escola.com',
        password: 'senha123'
      });
    expect(res.statusCode).toBe(401);
  });

  it('retorna 403 quando for um token de aluno', async () => {
    const res = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send({
        name: 'Maria Santos',
        email: 'maria@escola.com',
        password: 'senha123'
      });
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Acesso restrito a professores/i);
  });

  it('retorna 500 se der erro interno ao criar aluno', async () => {
    jest.spyOn(Student.prototype, 'save').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const res = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Maria Santos',
        email: 'maria@escola.com',
        password: 'senha123'
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Erro ao criar aluno/i);
  });
});

/* -------------------------------------------------------------------------- */
/*  GET /students                                                              */
/* -------------------------------------------------------------------------- */
describe('GET /students', () => {
  it('lista todos os alunos (200)', async () => {
    await Student.create({
      name: 'Aluno A',
      email: 'alunoa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno',
      status: 'ativo'
    });
    await Student.create({
      name: 'Aluno B',
      email: 'alunob@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno',
      status: 'inativo'
    });

    const res = await request(app)
      .get('/students')
      .set('Authorization', `Bearer ${tokenProfessor}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).not.toHaveProperty('password');
  });

  it('retorna 401 quando faltar token', async () => {
    const res = await request(app).get('/students');
    expect(res.statusCode).toBe(401);
  });

  it('retorna 403 quando for token de aluno', async () => {
    const res = await request(app)
      .get('/students')
      .set('Authorization', `Bearer ${tokenAluno}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Acesso restrito a professores/i);
  });

  it('retorna 500 quando der erro no get all', async () => {
    jest.spyOn(Student, 'find').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const res = await request(app)
      .get('/students')
      .set('Authorization', `Bearer ${tokenProfessor}`);
    
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Erro ao buscar alunos/i);
  });
});

/* -------------------------------------------------------------------------- */
/*  GET /students/:id                                                          */
/* -------------------------------------------------------------------------- */
describe('GET /students/:id', () => {
  it('retorna um aluno existente (200)', async () => {
    const student = await Student.create({
      name: 'Aluno A',
      email: 'alunoa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno',
      status: 'ativo'
    });

    const res = await request(app)
      .get(`/students/${student._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(student.id);
    expect(res.body.name).toBe('Aluno A');
    expect(res.body).not.toHaveProperty('password');
  });

  it('retorna 404 se id não existir', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/students/${fakeId}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);
    
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/Aluno não encontrado/i);
  });

  it('retorna 401 quando faltar token', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/students/${fakeId}`);
    expect(res.statusCode).toBe(401);
  });

  it('retorna 403 quando for token de aluno', async () => {
    const student = await Student.create({
      name: 'Aluno A',
      email: 'alunoa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno'
    });

    const res = await request(app)
      .get(`/students/${student._id}`)
      .set('Authorization', `Bearer ${tokenAluno}`);
    
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Acesso restrito a professores/i);
  });

  it('retorna 500 quando der erro no get by id', async () => {
    jest.spyOn(Student, 'findById').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/students/${fakeId}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);
    
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Erro ao buscar aluno/i);
  });
});

/* -------------------------------------------------------------------------- */
/*  PUT /students/:id                                                          */
/* -------------------------------------------------------------------------- */
describe('PUT /students/:id', () => {
  it('atualiza um aluno existente (200)', async () => {
    const student = await Student.create({
      name: 'Aluno Original',
      email: 'original@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno',
      status: 'ativo'
    });

    const res = await request(app)
      .put(`/students/${student._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Aluno Atualizado',
        status: 'inativo'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Aluno Atualizado');
    expect(res.body.status).toBe('inativo');
    expect(res.body).not.toHaveProperty('password');
  });

  it('atualiza apenas o nome', async () => {
    const student = await Student.create({
      name: 'Aluno Original',
      email: 'original@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno'
    });

    const res = await request(app)
      .put(`/students/${student._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Novo Nome'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Novo Nome');
    expect(res.body.email).toBe('original@escola.com');
  });

  it('atualiza a senha', async () => {
    const student = await Student.create({
      name: 'Aluno Original',
      email: 'original@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno'
    });

    const res = await request(app)
      .put(`/students/${student._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        password: 'novaSenha123'
      });

    expect(res.statusCode).toBe(200);
    
    // Verificar se a senha foi realmente atualizada (hash diferente)
    const updatedStudent = await Student.findById(student._id);
    const isMatch = await bcrypt.compare('novaSenha123', updatedStudent.password);
    expect(isMatch).toBe(true);
  });

  it('retorna 404 se aluno não existir', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/students/${fakeId}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Novo Nome'
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/Aluno não encontrado/i);
  });

  it('retorna 400 quando email já está em uso', async () => {
    await Student.create({
      name: 'Aluno A',
      email: 'existente@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno'
    });

    const student = await Student.create({
      name: 'Aluno B',
      email: 'outro@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno'
    });

    const res = await request(app)
      .put(`/students/${student._id}`)
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
      .put(`/students/${fakeId}`)
      .send({ name: 'Novo Nome' });
    expect(res.statusCode).toBe(401);
  });

  it('retorna 403 quando for token de aluno', async () => {
    const student = await Student.create({
      name: 'Aluno A',
      email: 'alunoa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno'
    });

    const res = await request(app)
      .put(`/students/${student._id}`)
      .set('Authorization', `Bearer ${tokenAluno}`)
      .send({ name: 'Novo Nome' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Acesso restrito a professores/i);
  });

  it('retorna 500 quando der erro no update', async () => {
    const student = await Student.create({
      name: 'Aluno A',
      email: 'alunoa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno'
    });

    jest.spyOn(Student, 'findById').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const res = await request(app)
      .put(`/students/${student._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({ name: 'Novo Nome' });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Erro ao atualizar aluno/i);
  });
});

/* -------------------------------------------------------------------------- */
/*  DELETE /students/:id                                                       */
/* -------------------------------------------------------------------------- */
describe('DELETE /students/:id', () => {
  it('deleta um aluno existente (200)', async () => {
    const student = await Student.create({
      name: 'Aluno A',
      email: 'alunoa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno'
    });

    const res = await request(app)
      .delete(`/students/${student._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Aluno excluído com sucesso/i);

    // Verificar se foi realmente deletado
    const deletedStudent = await Student.findById(student._id);
    expect(deletedStudent).toBeNull();
  });

  it('retorna 404 se aluno não existir', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/students/${fakeId}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/Aluno não encontrado/i);
  });

  it('retorna 401 quando faltar token', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/students/${fakeId}`);
    expect(res.statusCode).toBe(401);
  });

  it('retorna 403 quando for token de aluno', async () => {
    const student = await Student.create({
      name: 'Aluno A',
      email: 'alunoa@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno'
    });

    const res = await request(app)
      .delete(`/students/${student._id}`)
      .set('Authorization', `Bearer ${tokenAluno}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Acesso restrito a professores/i);
  });

  it('retorna 500 quando der erro no delete', async () => {
    jest.spyOn(Student, 'findByIdAndDelete').mockImplementation(() => {
      throw new Error('Erro simulado');
    });

    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/students/${fakeId}`)
      .set('Authorization', `Bearer ${tokenProfessor}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Erro ao deletar aluno/i);
  });
});
