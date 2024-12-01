const MovimentoEstoque = require('../models/MovimentoEstoque');
const checkPermision = require('../config/checkPermision');
const atualizarEstoqueERegistrarMovimentacao = require('../utils/registerMovement');

function movimentoEstoqueController(app) {
    app.post('/registra-movimentacao', checkPermision('adm'), async (req, res) => {
        const { produtoId, quantidade, usuario } = req.body;

        if (!produtoId || !quantidade || !usuario) {
            return res.status(400).json({ msg: "Todos os campos são obrigatórios." });
        }

        const origem = 'Adicionar Estoque'

        const resultado = await atualizarEstoqueERegistrarMovimentacao(produtoId, quantidade, usuario, origem);

        if (resultado.success) {
            return res.status(201).json({
                msg: resultado.mensagem,
                movimentacao: resultado.movimentacao
            });
        } else {
            return res.status(400).json({ msg: resultado.mensagem });
        }
    });

    app.get('/listar-movimentacoes', checkPermision('adm'), async (req, res) => {
        try {
            const movimentacoes = await MovimentoEstoque.find()
                .populate('produtoId', 'nome images')
                .populate('usuario', 'nome email')
                .sort({ dataMovimento: -1 });

            res.status(200).json(movimentacoes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro ao listar movimentações." });
        }
    });
}

module.exports = { movimentoEstoqueController };