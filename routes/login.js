//importa os módulos necessários
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

//importa o objeto de conexão e cria um objeto de roteamento
const conn = require("../config/connect");
const router = express.Router();

//importa o arquivo .env
require("dotenv").config();

//rota para POST url/login
router.post("/", (req, res) => {
    //obtem o nome e a senha passados no json da requisição
    const {name, password} = req.body;

    //se um dos dois estiver ausentes, exibe o erro abaixo:
    if(!name || !password) {
        return res.status(400).json({
            "status":"erro",
            "mensagem":"um parâmetros ausentes.",
            "token": []
        });
    }

    //se não, executa a busca dos dados pelo nome
    conn.query("select * from Users where name = ?", [name], async (err, result) => {
        if(err) { //se houver algum problema com o banco no momento da pesquisa, retorna a mensagem abaixo:
            return res.status(500).json({
                "status":"erro",
                "mensagem":"erro no servidor.",
                "token": []
            });
        }
        if(result.length <= 0) { //se não houver resultado para o nome inserido, envia o erro abaixo
            return res.status(400).json({
                "status":"erro",
                "mensagem":"confira as credênciais inseridas.",
                "token": []
            });
        } else { //caso o nome de usuário seja válido:
            //comaprar o bcrypt da senha inserida com a presente no banco
            const isValid = await bcrypt.compare(password, result[0].password);

            if(isValid) { //se a senha for correta, o token é gerado e retornado em uma mensagem
                const token = jwt.sign(
                {id: result[0].id, name: result[0].name}, // Payload
                process.env.JWT_SECRET,  // Secret
                { expiresIn: "10min" }); // Tempo de expiração

                return res.status(200).json({
                    "status":"sucesso",
                    "mensagem":"credenêciais corretas.",
                    "token": token
                });
            }
            //caso algo saia do planejado, exibe um erro.
            return res.status(400).json({
                "status":"erro",
                "mensagem":"confira as credênciais inseridas.",
                "token": []
            });
        }
    });
});

//exporta o objeto de roteamento 
module.exports = router;
