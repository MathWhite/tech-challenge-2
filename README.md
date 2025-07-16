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

## 📦 Instalação e Uso

### ✅ Requisitos

- Node.js 18+
- Docker e Docker Compose
- Git

### 💻 Clonando o projeto

```
git clone https://github.com/MathWhite/tech-challenge-2.git
cd tech-challenge-2
npm install
```

### ▶️ Rodando localmente (sem Docker)

```bash
cp .env.example .env #Edite o .env
npm run dev
```

A aplicação estará disponível em: http://localhost:3000
Assumindo que PORT em .env seja 3000

### 🐳 Rodando com Docker

```bash
docker-compose up --build
```
Acesse em: http://localhost:3000
Assumindo que PORT em .env seja 3000


## 🧪 Testes Automatizados

```bash
npm test
```

A cobertura atual está acima de 80%, com foco em criação, edição, leitura e exclusão de posts.

## 🔍 Documentação da API

Swagger disponível em:

GET /api-docs

Exemplo: http://localhost:3000/api-docs
Assumindo que PORT em .env seja 3000

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

Arquivo: .github/workflows/test.yml

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
