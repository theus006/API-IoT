//importa as bibliotecas necessárias
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, '../.env') //Adapta o caminho do arquivo para o diretório atual
});

//cria a função que valida o token
const verifyToken = (req, res, next) => {
    // Obtém o cabeçalho de autorização da requisição (Bearer)
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    // Verifica se o token está presente
    if (!token) {
        return res.status(403).json({
            "status":"erro",
            "mensagem":"token não fornecido"
        });
    }

    //tenta converter o token ao formato original e validar a asinatura
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //passa os parâmtros convertidos a requisição
        req.username = decoded.name;
        req.userID = decoded.id;
        next();

    } catch(error) { //exibe um erro se o payload foi modificado ou se o token for inválido por exemplo
        return res.status(404).json({
            "status":"erro",
            "mensagem":"token inválido"
        });
    }
}

//exporta a função para outros módulos
module.exports = verifyToken;

