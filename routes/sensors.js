//importa o framework express
const express = require("express");

//cria um objeto de roteamento e importa o objeto de conexão com o banco 
//e o middleware que verifica se há login feito.
const router = express.Router();
const conn = require("../config/connect");
const auth = require("../middlewares/auth")

//rota para GET url/sensors -> retorna os dados dos sensores de um usuário pelo ID
router.get("/", auth, (req, res) => {
    //confirma se o id foi passado pela rota de autenticação com jwt
    if(!req.userID) { //caso não tenha passado o id, retorna a mensagem abaixo
        return res.status(400).json({
            "status": "erro", 
            "mensagem": "id de usuário ausente"
        });
    }

    //executa a consulta no banco, filtrando pelo id recebido após validar o jwt
    conn.query("select * from Sensors where id_user = ?",[req.userID], (err, result) => {
        if(err) { //se houve algum erro no banco ou servidor no momento da pesquisa, retorna o erro abaixo:
            console.log(err); //exibe o erro no terminal
            return res.status(500).json({
                "status": "erro",
                "mensagem": "erro no servidor"
            });
        }
        if(result.length > 0) { 
            return res.status(200).json({ //se houverem registros, os retorna.
                "status": "sucesso",
                "sensores": result
            });
        } else {
            return res.status(200).json({ //se não houvem resultados, retorna [].
                "status": "sucesso",
                "sensores": []
            });
        }
    });
});

//exporta o objeto de rotas para outros módulos
module.exports = router;