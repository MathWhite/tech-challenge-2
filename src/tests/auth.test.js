const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const authRoutes = require('../routes/authRoutes');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

let app;
let mongoServer;

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
  app.use('/login', authRoutes);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await Teacher.deleteMany({});
  await Student.deleteMany({});
  jest.restoreAllMocks();
});

/* -------------------------------------------------------------------------- */
/*  POST /login - Casos de sucesso                                            */
/* -------------------------------------------------------------------------- */
describe('POST /login - Casos de sucesso', () => {
  it('deve fazer login com sucesso usando professor do banco (200)', async () => {
    // Criar professor no banco
    await Teacher.create({
      name: 'Professor Admin',
      email: 'admin@escola.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'professor',
      isActive: true
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: 'admin@escola.com',
        senha: 'admin123',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Login realizado com sucesso.');
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('admin@escola.com');
    expect(res.body.user.role).toBe('professor');
    expect(res.body.user).toHaveProperty('name', 'Professor Admin');
    expect(res.body.user).toHaveProperty('id');

    // Verificar se o token é válido
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.email).toBe('admin@escola.com');
    expect(decoded.role).toBe('professor');
    expect(decoded).toHaveProperty('iat');
    expect(decoded).toHaveProperty('exp');
  });

  it('deve fazer login com sucesso usando aluno do banco (200)', async () => {
    // Criar aluno no banco
    await Student.create({
      name: 'Aluno Teste',
      email: 'aluno@escola.com',
      password: await bcrypt.hash('aluno123', 10),
      role: 'aluno',
      isActive: true
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: 'aluno@escola.com',
        senha: 'aluno123',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Login realizado com sucesso.');
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('aluno@escola.com');
    expect(res.body.user.role).toBe('aluno');
    expect(res.body.user).toHaveProperty('name', 'Aluno Teste');

    // Verificar se o token é válido
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.email).toBe('aluno@escola.com');
    expect(decoded.role).toBe('aluno');
  });

  it('deve retornar token válido com expiração de 24h', async () => {
    await Teacher.create({
      name: 'Professor Teste',
      email: 'prof@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: true
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: 'prof@escola.com',
        senha: 'senha123',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(200);
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    
    // Verificar se a expiração é de 24h
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBe(86400); // 24h em segundos
  });

  it('deve priorizar Teacher quando email existe em ambas collections', async () => {
    const sameEmail = 'duplicado@escola.com';
    
    await Teacher.create({
      name: 'Professor',
      email: sameEmail,
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: true
    });

    await Student.create({
      name: 'Aluno',
      email: sameEmail,
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno',
      isActive: true
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: sameEmail,
        senha: 'senha123',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe('professor'); // Deve retornar professor
  });
});

/* -------------------------------------------------------------------------- */
/*  POST /login - Validação de campos obrigatórios                            */
/* -------------------------------------------------------------------------- */
describe('POST /login - Validação de campos obrigatórios', () => {
  it('deve retornar 400 quando faltar o campo email', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        senha: 'admin',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: 'Email é obrigatório'
        })
      ])
    );
  });

  it('deve retornar 400 quando faltar o campo senha', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'admin',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: 'Senha é obrigatória'
        })
      ])
    );
  });

  it('deve retornar 400 quando faltar o campo palavra-passe', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'admin',
        senha: 'admin'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: 'Palavra-passe é obrigatória'
        })
      ])
    );
  });

  it('deve retornar 400 quando faltar todos os campos', async () => {
    const res = await request(app)
      .post('/login')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('deve retornar 400 quando email for vazio', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: '',
        senha: 'admin',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(400);
  });

  it('deve retornar 400 quando senha for vazia', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'admin',
        senha: '',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(400);
  });

  it('deve retornar 400 quando palavra-passe for vazia', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'admin',
        senha: 'admin',
        'palavra-passe': ''
      });

    expect(res.statusCode).toBe(400);
  });
});

/* -------------------------------------------------------------------------- */
/*  POST /login - Validação de palavra-passe                                  */
/* -------------------------------------------------------------------------- */
describe('POST /login - Validação de palavra-passe', () => {
  it('deve retornar 401 quando palavra-passe for incorreta', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'admin',
        senha: 'admin',
        'palavra-passe': 'senhaerrada'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Palavra-passe incorreta.');
  });

  it('deve retornar 401 quando palavra-passe for parcialmente correta', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'admin',
        senha: 'admin',
        'palavra-passe': 'secreta12'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Palavra-passe incorreta.');
  });

  it('deve retornar 401 quando palavra-passe tiver case diferente', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'admin',
        senha: 'admin',
        'palavra-passe': 'SECRETA123'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Palavra-passe incorreta.');
  });
});

/* -------------------------------------------------------------------------- */
/*  POST /login - Validação de credenciais                                    */
/* -------------------------------------------------------------------------- */
describe('POST /login - Validação de credenciais', () => {
  it('deve retornar 401 quando email não existir no banco', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'usuario_inexistente@escola.com',
        senha: 'qualquersenha',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Email ou senha incorretos.');
  });

  it('deve retornar 401 quando senha de professor for incorreta', async () => {
    await Teacher.create({
      name: 'Professor',
      email: 'prof@escola.com',
      password: await bcrypt.hash('senhaCorreta', 10),
      role: 'professor',
      isActive: true
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: 'prof@escola.com',
        senha: 'senhaerrada',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Email ou senha incorretos.');
  });

  it('deve retornar 401 quando senha de aluno for incorreta', async () => {
    await Student.create({
      name: 'Aluno',
      email: 'aluno@escola.com',
      password: await bcrypt.hash('senhaCorreta', 10),
      role: 'aluno',
      isActive: true
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: 'aluno@escola.com',
        senha: 'senhaerrada',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Email ou senha incorretos.');
  });

  it('deve retornar 401 quando professor estiver inativo', async () => {
    await Teacher.create({
      name: 'Professor Inativo',
      email: 'inativo@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: false
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: 'inativo@escola.com',
        senha: 'senha123',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Usuário inativo.');
  });

  it('deve retornar 401 quando aluno estiver inativo', async () => {
    await Student.create({
      name: 'Aluno Inativo',
      email: 'aluno_inativo@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'aluno',
      isActive: false
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: 'aluno_inativo@escola.com',
        senha: 'senha123',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Usuário inativo.');
  });
});

/* -------------------------------------------------------------------------- */
/*  POST /login - Casos de erro                                               */
/* -------------------------------------------------------------------------- */
describe('POST /login - Casos de erro', () => {
  it('deve retornar 500 quando jwt.sign lançar erro', async () => {
    await Teacher.create({
      name: 'Professor',
      email: 'prof@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: true
    });

    jest.spyOn(jwt, 'sign').mockImplementation(() => {
      throw new Error('Erro ao gerar token');
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: 'prof@escola.com',
        senha: 'senha123',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message', 'Erro ao realizar login.');
    expect(res.body).toHaveProperty('error');
  });

  it('deve retornar 500 quando bcrypt.compare lançar erro', async () => {
    await Teacher.create({
      name: 'Professor',
      email: 'prof@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: true
    });

    jest.spyOn(bcrypt, 'compare').mockImplementation(() => {
      throw new Error('Erro no bcrypt');
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: 'prof@escola.com',
        senha: 'senha123',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message', 'Erro ao realizar login.');
  });
});

/* -------------------------------------------------------------------------- */
/*  POST /login - Casos edge                                                  */
/* -------------------------------------------------------------------------- */
describe('POST /login - Casos edge', () => {
  it('deve aceitar email com espaços no início/fim (trimmed)', async () => {
    await Teacher.create({
      name: 'Professor',
      email: 'prof@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: true
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: '  prof@escola.com  ',
        senha: 'senha123',
        'palavra-passe': 'secreta123'
      });

    // Deve funcionar pois o validator faz trim no email
    expect(res.statusCode).toBe(200);
  });

  it('deve rejeitar quando body não for JSON', async () => {
    const res = await request(app)
      .post('/login')
      .send('não é json');

    expect(res.statusCode).toBe(400);
  });

  it('deve aceitar campos extras no body sem causar erro', async () => {
    await Teacher.create({
      name: 'Professor',
      email: 'prof@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: true
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: 'prof@escola.com',
        senha: 'senha123',
        'palavra-passe': 'secreta123',
        campoExtra: 'valor qualquer',
        outroExtra: 123
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('prof@escola.com');
  });
});

/* -------------------------------------------------------------------------- */
/*  POST /login - Verificação de estrutura de resposta                        */
/* -------------------------------------------------------------------------- */
describe('POST /login - Estrutura de resposta', () => {
  it('deve retornar a estrutura correta no sucesso', async () => {
    await Teacher.create({
      name: 'Professor Teste',
      email: 'prof@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: true
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: 'prof@escola.com',
        senha: 'senha123',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email');
    expect(res.body.user).toHaveProperty('role');
    expect(res.body.user).toHaveProperty('name');
    expect(res.body.user).toHaveProperty('id');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  it('não deve retornar senha ou dados sensíveis na resposta', async () => {
    await Teacher.create({
      name: 'Professor',
      email: 'prof@escola.com',
      password: await bcrypt.hash('senha123', 10),
      role: 'professor',
      isActive: true
    });

    const res = await request(app)
      .post('/login')
      .send({
        email: 'prof@escola.com',
        senha: 'senha123',
        'palavra-passe': 'secreta123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('senha');
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user).not.toHaveProperty('senha');
  });
});
