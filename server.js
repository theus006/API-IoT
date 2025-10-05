//importa o express
const express = require("express");

//importa o arquivo .env com a numeração da porta
require("dotenv").config();

//importa o arquivo de roteamento para /users
const usersRouter = require("./routes/users");

//cria uma instância de aplicação express
const app = express();

//trata o json no body das requisições
app.use(express.json());

//direciona as requisições para /users ao arquivo de rotas correspondente
app.use("/users", usersRouter);

//inicia o servidor e define a porta que receberá as solicitações
app.listen(process.env.PORT, () => {
    console.log(`Servidor rodando na porta ${process.env.PORT}`);
});