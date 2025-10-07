//importa o framework express
const express = require("express");

//cria um objeto de roteamento e importa o objeto de conexão com o banco 
//e o middleware que verifica se há login feito.
const router = express.Router();
const conn = require("../config/connect");
const auth = require("../middlewares/auth")

//aplica o middleware de autenticação para todas as rotas.
router.use(auth);

//rota para GET url/sensors -> retorna os dados dos sensores de um usuário pelo ID
router.get("/", (req, res) => {
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

//rota POST /sensors para criar um novo sensor -> rota protegida por jwt
router.post("/", (req, res) => {
    //obtem o ID do usuário passado pelo jwt e o nome do sensor passado em JSON
    const {sensorName} = req.body;
    const userID = req.userID;

    //se o nome do sensor não foi informado, retorna um erro
    if(!sensorName) {
        return res.status(400).json({
            "status": "erro", 
            "mensagem": "nome do sensor ausente"
        });
    }
    //antes de tentar inserir, busca no banco se esse nome já existe com o mesmo userID
    conn.query("select name, id_user from Sensors where id_user = ? and name = ?", [userID, sensorName],(err, result) => {
        if(err) { //se houver algum erro no momento da pesquisa, uma mensagem é retornada
            console.log(err); //exibe o erro no terminal
            return res.status(500).json({
                "status": "erro",
                "mensagem": "erro no servidor"
            });
        }
        if(result.length > 0) { //caso verifique que já existe o sensor, retorna um erro
            return res.status(409).json({
                "status": "erro", 
                "mensagem": "nome de sensor já cadastrado"
            });
        } else { //se não houver o mesmo nome do sensor associado ao id do usuário, adiciona-se no banco
            conn.query("insert into Sensors (name, id_user) values (?, ?)", [sensorName, userID],(err, result) => {
                if(err) { //se houver algum erro no momento da ação, uma mensagem é retornada
                    console.log(err); //exibe o erro no terminal
                    return res.status(500).json({
                        "status": "erro",
                        "mensagem": "erro no servidor"
                    });
                }
                if(result.affectedRows > 0) { //se a quantidade de linhas afetadas for maior que 0, confirma-se a criação
                    return res.status(201).json({
                        "status": "sucesso",
                        "mensagem": "sensor adicionado!"
                    });
                } else { //se algo sair do planejamento, exibe um erro
                    return res.status(400).json({
                        "status": "erro",
                        "mensagem": "sensor não pôde ser adicionado!"
                    });
                }
            });
        }
    });
});

//rota para DELETE url/sensors/:sensorID -> deleta um sensor de um usuário pelo ID do sensor
router.delete("/:sensorID", (req, res) => {
    //obtem o id do sensor passado na url e o id do usuário passado no jwt
    const {sensorID} = req.params;
    const userID = req.userID;

    //se não houver o id do sensor na requisição, retorna a mensagem de erro
    if(!sensorID) {
        return res.status(400).json({
            "status": "erro", 
            "mensagem": "ID do sensor ausente"
        });
    }
    //busca pela linha onde relaciona o id do usuário com o id do sensor, previnindo assim falhas por conta de id errado
    conn.query("select id, id_user from Sensors where id = ? and id_user = ?", [sensorID, userID], (err, result) => {
        if(err) { //se houver algum erro no momento da pesquisa, uma mensagem é retornada
            console.log(err); //exibe o erro no terminal
            return res.status(500).json({
                "status": "erro",
                "mensagem": "erro no servidor"
            });
        }
        if(result.length > 0) { //se a busca houver resultado, tenta a exclusão do sensor
            conn.query("delete from Sensors where id = ?", [sensorID], (err, result) => {
                if(err) { //se houver algum erro no momento da pesquisa, uma mensagem é retornada
                    console.log(err); //exibe o erro no terminal
                    return res.status(500).json({
                        "status": "erro",
                        "mensagem": "erro no servidor"
                    });
                }
                if(result.affectedRows > 0) { //se a quantidade de linhas afetadas for maior que 0, confirma-se a remoção
                    return res.status(200).json({
                        "status": "sucesso",
                        "mensagem": "sensor removido!"
                    });
                } else { //se algo sair do planejamento, exibe um erro
                    return res.status(400).json({
                        "status": "erro",
                        "mensagem": "sensor não pôde ser removido!"
                    });
                }
            });
        } else { //caso contrário retorna que não encontrou o id (segurança)
            return res.status(404).json({
                "status": "erro", 
                "mensagem": "ID não encontrado"
            });
        }
    });
});

//rota para PATCH url/sensors/:sensorID -> renomeia ou atualiza o valor de um sensor pelo seu ID
router.patch("/:sensorID", (req, res) => {
    //obtem o novo nome ou novo valor passado no body da requisição
    const {sensorName, value} = req.body;
    const {sensorID} = req.params;
    //obtem o id do usuário que fez a requisição (obtem pelo jwt)
    const userID = req.userID;

    if(!sensorName && !value) { //se não houver valor para o novo nome ou novo valor de leitura, retorna um erro
        return res.status(400).json({
            "status": "erro", 
            "mensagem": "não foram informados dados para alteração"
        });
    }

    if(sensorName && value) { //se tiver os 2 valores ao mesmo tempo, retorna um erro
        return res.status(400).json({
            "status": "erro", 
            "mensagem": "não é possível atualizar nome e valor ao mesmo tempo!"
        });
    }

    if(sensorName) { //se a ação for para renomear um sensor
        //busca pelo nome informado entre os sensores cadastrados para o usuário
        conn.query("select name from Sensors where name = ? and id_user = ?", [sensorName, userID], (err, result) => {
            if(result.length > 0) { //se encontrar, informa que o nome está duplicado
                return res.status(400).json({
                    "status": "erro", 
                    "mensagem": "nome de sensor já existente para este usuário"
                });
            } else { //caso não encontre o nome entre os já existentes, tenta renomear
                conn.query("update Sensors set name = ? where id = ? and id_user = ?", [sensorName, sensorID, userID], (err, result) => {
                    if(err) { //se houver algum erro no momento da pesquisa, uma mensagem é retornada
                        console.log(err); //exibe o erro no terminal
                        return res.status(500).json({
                            "status": "erro",
                            "mensagem": "erro no servidor"
                        });
                    }
                    if(result.affectedRows > 0) { //se após o filtro foi possível renomear, retorna uma mensagem de sucesso
                        return res.status(200).json({
                            "status": "sucesso",
                            "mensagem": "sensor renomeado"
                        });
                    } else { //caso nem uma linha sofreu alteração, indica que o sensor não foi encontrado para esse usuário
                        return res.status(404).json({
                            "status": "erro",
                            "mensagem": "ID não encontrado"
                        });
                    }
                });
            }
        })
    }
    if(value) { //caso deseja-se atualizar um valor de leitura, tenta-se atualizar filtrando por uma correspondência com o id do usuário e do sensor
        conn.query("update Sensors set value = ? where id = ? and id_user = ?", [value, sensorID, userID], (err, result) => {
            if(err) { //se houver algum erro no momento da pesquisa, uma mensagem é retornada
                console.log(err); //exibe o erro no terminal
                return res.status(500).json({
                    "status": "erro",
                    "mensagem": "erro no servidor"
                });
            }
            if(result.affectedRows > 0) { //se houve alguma alteração, retorna uma mensagem de sucesso
                return res.status(200).json({
                    "status": "sucesso",
                    "mensagem": "valor do sensor atualizado"
                });
            } else { //caso contrário, possivelmente o id inserido não corresponde a um sensor desse usuário, retornando um erro
                return res.status(404).json({
                    "status": "erro",
                    "mensagem": "sensor não encontrado"
                });
            }
        });
    }
});

//exporta o objeto de rotas para outros módulos
module.exports = router;