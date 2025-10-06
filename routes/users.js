//importa as bibliotecas necessárias
const express = require("express");
const bcrypt = require("bcrypt");

//importa o objeto de conexão com o banco, criado e parametrisado 
//em outro arquivo
const conn = require("../config/connect");
//importa o middleware que verifica se o usuário está logado
const auth = require("../middlewares/auth");

//cria um objeto de roteamento
const router = express.Router();

//rota POST url/users/ -> adicionar usuários
router.post("/", async (req, res) => {
    //obtem os dados em JSON necessários, já extraidos pelo express.json() 
    //no script principal da aplicação
    const {name, password} = req.body;

    if(!name || !password) { //caso a senha ou o nome do usuário estejam faltando:
        //retorna um erro e sua mensagem
        return res.status(400).json({
            "status":"erro",
            "mensagem":"um parâmetros ausentes."
        });
    }
    //estando todos os parâmetros, cria-se o hash da senha
    const hash = await bcrypt.hash(password, 10);

    conn.query("select name from Users where name = ?", [name], (err, result) => { //verifica se o usuário já existe
        if(err) { //se houver algum problema com o banco no momento da pesquisa, retorna a mensagem abaixo:
            console.log(err); //exibe o erro no console
            return res.status(500).json({
                "status":"erro",
                "mensagem":"erro no servidor."
            });
        }
        if(result.length > 0) { //se o nome for encontrado no banco, encerra o script e avisa o usuário que já existe
            return res.status(409).json({
                "status":"erro",
                "mensagem":"usuário já existente"
            }); 
        } else { //se não existir, tenta a inserção dos dados no banco (note que foi passado o hash da senha)
            conn.query("insert into Users(name, password) values(?,?)", [name, hash], (err, result) => {
                if(err) {
                    console.log(err); //exibe o erro no console
                    return res.status(500).json({ //se houver algum problema com o banco no momento da ação, retorna a mensagem abaixo:
                        "status":"erro",
                        "mensagem":"erro no servidor."
                    });
                }
                if(result.affectedRows >= 1) { //se o usuário foi adicionado, retorna a mensagem abaixo:
                    return res.status(201).json({
                        "status":"sucesso",
                        "mensagem":`usuário ${name} criado.`
                    });
                } else { //caso contrário, retorna o erro abaixo
                    return res.status(400).json({
                        "status":"erro",
                        "mensagem":"o usuáro não pôde ser criado."
                    });
                }
            });
        }
    });
});

//rota PATCH url/users/:name -> atualizar senha pelo nome
router.patch("/:name", async (req, res) => {
    //obtem a nova senha em json, passada pelo body e tratada no 
    //script do servidor
    const {name} = req.params;
    const {password} = req.body;

    if(!name || !password) { //caso a senha ou o nome do usuário estejam faltando:
        //retorna um erro e sua mensagem
        return res.status(400).json({
            "status":"erro",
            "mensagem":"um parâmetros ausentes."
        });
    }
    //estando todos os parâmetros, cria-se o hash da senha
    const hash = await bcrypt.hash(password, 10);

    conn.query("select name from Users where name = ?", [name], (err, result) => {
        if(err) { //se houver algum problema com o banco no momento da pesquisa, retorna a mensagem abaixo:
            console.log(err); //exibe o erro no console
            return res.status(500).json({
                "status":"erro",
                "mensagem":"erro no servidor."
            });
        }
        if(result.length > 0) { //se forem encontrados registros no banco, tenta atualizar a senha
            conn.query("update Users set password = ? where name = ?", [hash, name], (err, result) => {
                if(err) {//se houver algum erro no servidor no momento da ação, retorna a mensagem abaixo
                    console.log(err); //exibe o erro no console
                    return res.status(500).json({
                        "status":"erro",
                        "mensagem":"erro no servidor."
                    });
                }
                if(result.affectedRows > 0) { //se o processo for bem sucedido retorna a mensagem abaixo:
                    return res.status(200).json({
                        "status":"sucesso",
                        "mensagem":"senha redefinida."
                    });
                } else { //rota alternativa caso algo saia do planejamento
                    return res.status(400).json({
                        "status":"erro",
                        "mensagem":"não foi possível atualizar a senha."
                    });
                }
            });
        } else { //se não encontrar o usuário, exibe a mensagem abaixo
            return res.status(404).json({
                "status":"erro",
                "mensagem":"nome de usuário não encontrado."
            });
        }
    });
});

//rota DELETE url/users/:nome -> remove um usuário pelo nome (Exige login)
router.delete("/:name", auth, (req, res) => {
    const {name} = req.params;
    if(!name) { //se não foi específicado o nome na url
        return res.status(400).json({
            "status":"erro",
            "mensagem":"nome ausente"
        });
    }
    //verifica se o nome de usuário recebido pelo token é o mesmo a ser removido
    if(req.username != name) {
        return res.status(403).json({
            "status":"erro",
            "mensagem":"permissão negada"
        });
    } else {
        conn.query("delete from Users where name = ?", [name], (err, result)=> {//realiza a ação de deletar o registro pelo nome
            if(err) {
                console.log(err); //exibe o erro no console
                return res.status(500).json({ //se houver algum problema com o banco no momento da ação, retorna a mensagem abaixo:
                    "status":"erro",
                    "mensagem":"erro no servidor."
                });
            }
            if(result.affectedRows >= 1) { //se o usuário foi removido, retorna a mensagem abaixo:
                return res.status(200).json({
                    "status":"sucesso",
                    "mensagem":`usuário ${name} removido.`
                });
            } else { //caso contrário, retorna o erro abaixo
                return res.status(404).json({
                    "status":"erro",
                    "mensagem":"nome de usuário inexistente"
                });
            }
        });
    }
});

//exporta o objeto de roteamento para outros módulos
module.exports = router;