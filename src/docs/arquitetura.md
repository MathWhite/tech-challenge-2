# Arquitetura da Aplicação

## 🧱 Estrutura de Pastas

O projeto está organizado em camadas lógicas, seguindo princípios de separação de responsabilidades:

- `src/config` → Arquivos de configuração (DB, envs, JWT)
- `src/controllers` → Lógica das rotas (CRUD de posts, autenticação)
- `src/middlewares` → Middlewares globais (auth, erros, validações)
- `src/models` → Modelos do Mongoose (schema de postagens)
- `src/routes` → Definições das rotas da API
- `src/validators` → Regras de validação com `express-validator`
- `src/tests` → Testes unitários e de integração
- `src/seeds` → Dados iniciais de exemplo (se necessário)

## 🔐 Autenticação e Autorização

- Tokens JWT com claims (`role`, `name`)
- Middleware de autenticação verifica token e papel (`aluno` ou `professor`)
- Professores têm acesso completo à API
- Alunos têm acesso apenas à leitura de posts ativos

## 🧪 Testes

- Framework: `Jest` + `Supertest`
- Testes de todas as rotas principais com simulação de autenticação
- Cobertura de 100%

## 🌐 CI/CD

- CI: Testes automatizados via GitHub Actions
- CD: Deploy via Deploy Hook do Render (após testes passarem)
- Docker usado para ambiente local com `docker-compose`

## 🧩 Swagger

- Documentação acessível em `/api-docs`
- Descreve todas as rotas, parâmetros, exemplos e códigos de resposta
