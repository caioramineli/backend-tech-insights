const express = require('express');
const MovimentoEstoque = require('../models/MovimentoEstoque');
const Product = require('../models/Product')
const checkPermision = require('../config/checkPermision');

function movimentoEstoqueController(app) {
    app.post('/registra-movimentacao', async (req, res) => {
        const { produtoId, quantidade, usuario } = req.body;

        if (!produtoId || !quantidade || !usuario) {
            return res.status(400).json({ msg: "Todos os campos são obrigatórios." });
        }

        try {
            const produto = await Product.findById(produtoId);

            if (!produto) {
                return res.status(404).json({ msg: "Produto não encontrado!" });
            }

            produto.estoque = produto.estoque + quantidade

            await produto.save()

            const novaMovimentacao = new MovimentoEstoque({
                produtoId,
                quantidade,
                usuario
            });

            const resultado = await novaMovimentacao.save();

            res.status(201).json({
                msg: "Movimentação registrada com sucesso!",
                movimentacao: resultado
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro ao registrar movimentação." });
        }
    });

    app.get('/listar-movimentacoes', checkPermision('adm'), async (req, res) => {
        try {
            const movimentacoes = await MovimentoEstoque.find()
                .populate('produtoId', 'nome preco')
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