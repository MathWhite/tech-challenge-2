# Usa imagem oficial do Node.js
FROM node:18

# Define diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala dependências
RUN npm install -g nodemon && npm install

# Copia o restante do código
COPY . .

# Porta exposta
EXPOSE 3000

# Comando para rodar o servidor com hot reload
CMD ["nodemon", "src/index.js"]
