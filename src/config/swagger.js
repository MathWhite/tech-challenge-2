// src/config/swagger.js
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tech Challenge API',
      version: '1.0.0',
      description: 'Documentação da API de Posts do Tech Challenge',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local',
      },
    ],
  },
  apis: ['src/routes/*.js', 'src/models/*.js'], // locais dos comentários Swagger
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
