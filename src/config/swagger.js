require('dotenv').config();
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
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['src/routes/*.js', 'src/models/*.js'], // locais dos comentários Swagger
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
