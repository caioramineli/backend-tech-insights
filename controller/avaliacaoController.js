const Avaliacao = require('../models/Avaliacao')

function avaliacaoController(app) {

    app.post('/avaliacao/create', async (req, res) => {
        const { nota, titulo, descricao, userId, userName, userEmail, idProduto } = req.body;

        const avaliacoesByUser = await Avaliacao.find({ 'user.id': userId, idProduto: idProduto });

        if (avaliacoesByUser.length > 0) {
            return res.status(404).json({ msg: "Você só pode escrever uma avaliação por produto" });
        }

        const avalicao = new Avaliacao({
            nota,
            titulo,
            descricao,
            data: new Date(),
            user: {
                id: userId,
                nome: userName,
                email: userEmail
            },
            idProduto: idProduto
        });

        try {
            await avalicao.save()
            res.status(201).json({ msg: 'Avaliação realizada com sucesso!' })

        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: "Erro ao realizar avaliação!" })
        }
    })

    app.get("/avaliacao/:idProduto", async (req, res) => {
        const { idProduto } = req.params;

        try {
            const avaliacoes = await Avaliacao.find({ idProduto: idProduto });
            if (avaliacoes.length === 0) {
                return res.status(404).json({ msg: "Nenhum avaliação encontrada para esse produto!" });
            }
            res.status(200).json({ avaliacoes });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });
}

module.exports = { avaliacaoController };