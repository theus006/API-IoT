//importa o express
const express = require("express");

//importa o arquivo .env com a numeração da porta
require("dotenv").config();

//importa o arquivos de roteamento para /users, /sensors e /login
const usersRouter = require("./routes/users");
const login = require("./routes/login");
const sensors = require("./routes/sensors");

//cria uma instância de aplicação express
const app = express();

//trata o json no body das requisições
app.use(express.json());

//direciona as requisições aos endpoints aos arquivos de rotas correspondente
app.use("/users", usersRouter);
app.use("/login", login);
app.use("/sensors", sensors);

//inicia o servidor e define a porta que receberá as solicitações
app.listen(process.env.PORT, () => {
    console.log(`Servidor rodando na porta ${process.env.PORT}`);
});