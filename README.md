# 📝 Tech Challenge — Plataforma de Blogging para Professores

## 📚 Descrição

Este projeto é o back-end de uma aplicação de blogging dinâmica criada para professores da rede pública. A ideia é permitir que docentes publiquem conteúdos educacionais de forma prática, centralizada e acessível para seus alunos em todo o Brasil.

A solução foi originalmente desenvolvida com OutSystems e agora está sendo refatorada usando Node.js, com banco de dados persistente, testes automatizados, documentação via Swagger e CI/CD com GitHub Actions.

## 🚀 Tecnologias Utilizadas

- Node.js
- Express
- MongoDB
- Mongoose
- Docker
- Swagger
- Jest + Supertest
- express-validator
- GitHub Actions
- Jsonwebtoken

## 📦 Instalação e Uso

### ✅ Requisitos

- Node.js 18+
- Docker e Docker Compose (ou MongoDB local instalado)
- Git

### 🔍 Verificando requisitos

```bash
node -v            # Deve retornar v18.x ou superior
docker -v          # Deve retornar versão instalada do Docker
docker-compose -v  # Deve retornar versão instalada do Docker Compose
git --version      # Deve retornar versão do Git
```

### 💻 Clonando o projeto

```
git clone https://github.com/MathWhite/tech-challenge-2.git
cd tech-challenge-2
npm install
```

### ▶️ Rodando localmente (sem Docker)

```bash
npm run dev
```
> *Obs:* Você deve ter mongo rodando na sua máquina, caso contrário a conexão local irá falhar.

A aplicação estará disponível em: http://localhost:3000 (assumindo que PORT em .env seja 3000)

### 🐳 Rodando com Docker

```bash
docker-compose up --build
```
Acesse em: http://localhost:3000 (assumindo que PORT em .env seja 3000)

### 🔐 Tokens de Teste

Use os tokens abaixo para autenticação nos testes:

**Token Professor**

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicHJvZmVzc29yIiwibmFtZSI6Ik1hdGhldXMiLCJpYXQiOjE3NTI2NjgzMzZ9.BQUrflZw8QktIBmqOVWiPvu0jDowJl_-SiBr9yCyPv0
```

**Token Aluno**

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWx1bm8iLCJuYW1lIjoiTWF0aGV1cyIsImlhdCI6MTc1MjY2ODMzNn0.G6i94pkpNQQ5o-7pLpmNdSMbj1FfWpoBYn2U0oMBusU
```

⚠️ **Atenção:** Em um ambiente de produção, **jamais compartilhe ou exponha tokens sensíveis** publicamente. Esta abordagem foi adotada aqui apenas para fins educacionais e de correção da atividade.

- O token de **professor** funciona como uma **credencial administrativa**, com acesso total a todas as rotas da API (`GET`, `POST`, `PUT`, `DELETE`, `SEARCH`), incluindo visualização de posts inativos.

- O token de **aluno** possui **acesso restrito** apenas às rotas:
  - `GET /posts` → Retorna **apenas posts ativos**
  - `GET /posts/:id` → Retorna o post apenas se estiver **ativo**

Todos os demais endpoints retornarão `401 Unauthorized` quando acessados com o token de aluno.


## 🧪 Testes Automatizados

```bash
npm test
```

A cobertura atual está em 100%, com foco em criação, edição, leitura e exclusão de posts.

## 🔍 Documentação da API

Swagger disponível em:

```
GET /api-docs
```

Exemplo: http://localhost:3000/api-docs (assumindo que PORT em .env seja 3000)

A documentação inclui:
- Esquemas de request/response
- Exemplos práticos
- Códigos de erro esperados

## 📂 Endpoints REST

| Método | Rota               | Descrição                           |
|--------|--------------------|-------------------------------------|
| GET    | /posts             | Lista todas as postagens            |
| GET    | /posts/:id         | Lê uma postagem específica          |
| POST   | /posts             | Cria uma nova postagem              |
| PUT    | /posts/:id         | Atualiza uma postagem existente     |
| DELETE | /posts/:id         | Exclui uma postagem existente       |
| GET    | /posts/search?q=   | Busca por título, conteúdo ou autor |

## 🛠️ Estrutura do Projeto

```
.
├── src
│   ├── config
│   ├── controllers
│   ├── middlewares
│   ├── models
│   ├── routes
│   ├── seeds
│   ├── tests
│   ├── validators
│   └── index.js
├── .github
│   └── workflows
├── .env
├── coverage
├── Dockerfile
├── docker-compose.yml
├── README.md
```

## 🧪 CI com GitHub Actions

Workflow configurado para:
- Instalar dependências
- Rodar testes automatizados
- Verificar cobertura mínima

> Arquivo: .github/workflows/test.yml

## 📹 Apresentação (em andamento)

Vídeo demonstrando:
- Objetivo da aplicação
- Uso prático das rotas
- Funcionamento do Docker
- Testes e CI funcionando

Link será adicionado em breve.

## 🤝 Colaborador

- Matheus Carvalho

## 🏁 Conclusão

Este projeto foi desenvolvido com foco em entregar uma solução real e escalável para professores da rede pública, aplicando práticas modernas de desenvolvimento, testes e documentação.
