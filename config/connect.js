//importa as bibliotecas necessárias
const mysql = require("mysql2");
const path = require("path"); 

//importa o arquivo .env com os dados para a conexão
require("dotenv").config({
    path: path.resolve(__dirname, '../.env') //Adapta o caminho do arquivo para o diretório atual
});

//cria o objeto de conexão e passa os parâmtros do .env
const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

//executa a conexão
conn.connect((err) => {
    if(err) { //caso dê algo errado, exibe a mensagem no console
        return console.log(err);
    }
});

//exporta o objeto de conexão para outros arquivos
module.exports = conn;