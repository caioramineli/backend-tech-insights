const MovimentoEstoque = require('../models/MovimentoEstoque');
const Product = require('../models/Product')

const atualizarEstoqueERegistrarMovimentacao = async (produtoId, quantidade, usuario, origem) => {
    try {
        const produto = await Product.findById(produtoId);
        if (!produto) {
            throw new Error("Produto não encontrado!");
        }

        produto.estoque = produto.estoque + quantidade;
        await produto.save();

        const novaMovimentacao = new MovimentoEstoque({
            produtoId,
            quantidade,
            usuario,
            origem
        });

        const resultado = await novaMovimentacao.save();

        return {
            success: true,
            mensagem: "Movimentação registrada com sucesso!",
            movimentacao: resultado
        };
    } catch (error) {
        return {
            success: false,
            mensagem: error.message || "Erro ao processar a movimentação."
        };
    }
};


module.exports = atualizarEstoqueERegistrarMovimentacao;
