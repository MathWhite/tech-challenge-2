const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const bcrypt = require('bcrypt');

const teacherRoutes = require('../routes/teacherRoutes');
const authRoutes = require('../routes/authRoutes');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

let app;
let mongoServer;
let tokenProfessor;
let tokenAluno;

/* -------------------------------------------------------------------------- */
/*  Setup global                                                               */
/* -------------------------------------------------------------------------- */
beforeAll(async () => {
  process.env.JWT_SECRET = 'secreta123';
  
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use('/teachers', teacherRoutes);
  app.use('/login', authRoutes);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Criar usuário professor e fazer login
  await Teacher.create({
    name: 'Professor Admin',
    email: 'admin@escola.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'professor',
    isActive: true
  });

  // Criar usuário aluno e fazer login
  await Student.create({
    name: 'Aluno Teste',
    email: 'aluno@escola.com',
    password: await bcrypt.hash('aluno123', 10),
    role: 'aluno',
    isActive: true
  });

  // Obter token do professor
  const resProfessor = await request(app)
    .post('/login')
    .send({
      email: 'admin@escola.com',
      senha: 'admin123',
      'palavra-passe': 'secreta123'
    });
  tokenProfessor = resProfessor.body.token;

  // Obter token do aluno
  const resAluno = await request(app)
    .post('/login')
    .send({
      email: 'aluno@escola.com',
      senha: 'aluno123',
      'palavra-passe': 'secreta123'
    });
  tokenAluno = resAluno.body.token;
});

afterEach(async () => {
  await Teacher.deleteMany({});
  await Student.deleteMany({});
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
        isActive: true
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('João Silva');
    expect(res.body.email).toBe('joao.silva@escola.com');
    expect(res.body.role).toBe('professor');
    expect(res.body.isActive).toBe(true);
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

  it('retorna 400 quando email já existir como Student', async () => {
    await Student.create({
      name: 'Aluno Existente',
      email: 'aluno_existente@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno',
      isActive: true
    });

    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Professor Novo',
        email: 'aluno_existente@escola.com',
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

  it('cria professor com isActive=true explicitamente', async () => {
    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Professor Ativo',
        email: 'ativo@escola.com',
        password: 'senha123',
        isActive: true
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.isActive).toBe(true);
  });

  it('cria professor com isActive=false', async () => {
    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Professor Inativo',
        email: 'inativo@escola.com',
        password: 'senha123',
        isActive: false
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.isActive).toBe(false);
  });

  it('cria professor sem enviar isActive (deve ser true por padrão)', async () => {
    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Professor Padrão',
        email: 'padrao@escola.com',
        password: 'senha123'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.isActive).toBe(true);
  });

  it('retorna 400 quando isActive não for booleano', async () => {
    const res = await request(app)
      .post('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Professor Teste',
        email: 'teste@escola.com',
        password: 'senha123',
        isActive: 'sim'
      });

    expect(res.statusCode).toBe(400);
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
      isActive: true
    });
    await Teacher.create({
      name: 'Professor B',
      email: 'profb@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: false
    });

    const res = await request(app)
      .get('/teachers')
      .set('Authorization', `Bearer ${tokenProfessor}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(3); // 1 admin do beforeEach + 2 criados no teste
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
      isActive: true
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
      isActive: true
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Professor Atualizado',
        isActive: false
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Professor Atualizado');
    expect(res.body.isActive).toBe(false);
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

  it('atualiza isActive de true para false', async () => {
    const teacher = await Teacher.create({
      name: 'Professor Teste',
      email: 'teste@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: true
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        isActive: false
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.isActive).toBe(false);
  });

  it('atualiza isActive de false para true', async () => {
    const teacher = await Teacher.create({
      name: 'Professor Teste',
      email: 'teste@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: false
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        isActive: true
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.isActive).toBe(true);
  });

  it('não altera isActive quando não enviado no body', async () => {
    const teacher = await Teacher.create({
      name: 'Professor Original',
      email: 'original@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: false
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Novo Nome'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.isActive).toBe(false); // Deve manter o valor original
  });

  it('retorna 400 quando isActive não for booleano no update', async () => {
    const teacher = await Teacher.create({
      name: 'Professor Teste',
      email: 'teste@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        isActive: 'ativo'
      });

    expect(res.statusCode).toBe(400);
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

  it('retorna 400 quando tentar alterar email (imutável)', async () => {
    const teacher = await Teacher.create({
      name: 'Professor Teste',
      email: 'original@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        email: 'novo_email@escola.com'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Email não pode ser alterado/i);
  });

  it('aceita enviar o mesmo email (não altera)', async () => {
    const teacher = await Teacher.create({
      name: 'Professor Teste',
      email: 'teste@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor'
    });

    const res = await request(app)
      .put(`/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${tokenProfessor}`)
      .send({
        name: 'Novo Nome',
        email: 'teste@escola.com' // Mesmo email
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('teste@escola.com');
    expect(res.body.name).toBe('Novo Nome');
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
