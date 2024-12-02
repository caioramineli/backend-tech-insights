const Order = require('../models/Order')
const User = require('../models/User')
const Cupon = require('../models/Cupon')
const Product = require('../models/Product')
const checkPermision = require('../config/checkPermision');
const atualizarEstoqueERegistrarMovimentacao = require('../utils/registerMovement');
const axios = require('axios');

function orderController(app) {

    const ajustarEstoque = async (produtosComprados, usuario) => {
        try {
            for (const item of produtosComprados) {
                const { idProduto, quantidade } = item;

                const origem = 'Pedido Realizado';
                const resultado = await atualizarEstoqueERegistrarMovimentacao(idProduto, -quantidade, usuario, origem);

                if (!resultado.success) {
                    throw new Error(`Erro ao registrar movimentação para o produto ${idProduto}`);
                }
            }

            return { success: true, msg: 'Estoque ajustado e movimentações registradas com sucesso!' };
        } catch (error) {
            return { success: false, msg: error.message || 'Erro ao ajustar estoque.' };
        }
    };

    const msgPedidoRealizado = async (numeroCliente, numeroPedido, nomeCliente) => {
        try {
            const data = {
                phone: "55" + numeroCliente,
                flow: "674b931c3e201d0c84555d12",
                metadata: {
                    numeroPedido: numeroPedido,
                    nome: nomeCliente
                }
            };

            await axios.post(process.env.URL_IB, data)
            console.log('Enviou mensagem');
        } catch (error) {
            console.log(error);
        }
    };

    app.post('/order', checkPermision('normal'), async (req, res) => {
        const { idUser, produtos, idEndereco, formaPagamento, desconto, frete, valorTotal, codigoCupom, status } = req.body;
        const numeroPedido = Math.floor(Math.random() * 1000000);

        try {
            const order = new Order({
                numeroPedido,
                idUser,
                produtos,
                idEndereco,
                formaPagamento,
                desconto,
                frete,
                valorTotal,
                data: new Date(),
                status
            });

            await order.save();

            const movimentacaoNoEstoque = await ajustarEstoque(produtos, idUser);

            if (movimentacaoNoEstoque.success) {
                console.log(movimentacaoNoEstoque.msg);
            } else {
                console.error(movimentacaoNoEstoque.msg);
            }

            let cupom = null;
            if (codigoCupom) {
                cupom = await Cupon.findOne({ codigo: codigoCupom });
            }

            if (cupom) {
                cupom.quantidade -= 1;
                await cupom.save();
            }

            res.status(201).json({ msg: 'Pedido realizado com sucesso!', order });

            const user = await User.findById(idUser)

            primeiroNome = user.nome.split(' ')[0];
            msgPedidoRealizado(user.telefone, numeroPedido, primeiroNome);
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: "Erro ao realizar o pedido!" });
        }
    });

    app.get('/user/:id/orders', checkPermision('normal'), async (req, res) => {
        const { id } = req.params;

        try {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            const pedidos = await Order.find({ idUser: id })
                .sort({ data: -1 })
                .select('numeroPedido valorTotal formaPagamento frete data idEndereco status produtos')
                .populate({
                    path: 'produtos.idProduto',
                    select: 'nome images',
                    options: { lean: true }
                })
                .lean();

            if (!pedidos || pedidos.length === 0) {
                return res.status(404).json({ msg: 'Nenhum pedido encontrado!' });
            }

            const pedidosOrganizados = pedidos.map(pedido => ({
                id: pedido._id,
                numeroPedido: pedido.numeroPedido,
                data: pedido.data,
                formaPagamento: pedido.formaPagamento,
                status: pedido.status,
                produtos: pedido.produtos.map(produto => ({
                    id: produto.idProduto?._id,
                    nome: produto.idProduto?.nome,
                    quantidade: produto.quantidade,
                    imagem: produto.idProduto?.images[0]
                }))
            }));

            res.status(200).json(pedidosOrganizados);
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao buscar pedidos!' });
        }
    });

    app.get('/user/:id/orders/:orderId', checkPermision('normal'), async (req, res) => {
        const { id, orderId } = req.params;

        try {
            const user = await User.findById(id).select('enderecos');

            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            const pedido = await Order.findOne({ idUser: id, _id: orderId })
                .populate({
                    path: 'produtos.idProduto',
                    select: 'nome precoPrazo preco marca images'
                })
                .select('numeroPedido valorTotal desconto formaPagamento frete data idEndereco status produtos');

            if (!pedido) {
                return res.status(404).json({ msg: 'Pedido não encontrado!' });
            }

            const enderecoPedido = user.enderecos.find(endereco => endereco._id.equals(pedido.idEndereco));

            const pedidoOrganizado = {
                ...pedido.toObject(),
                produtos: pedido.produtos.map(produto => ({
                    dadosProduto: produto.idProduto,
                    quantidade: produto.quantidade
                })),
                endereco: enderecoPedido
            };

            res.status(200).json(pedidoOrganizado);

        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao buscar pedido!' });
        }
    });

    app.get('/user/:id/last-order', checkPermision('normal'), async (req, res) => {
        const { id } = req.params;

        try {
            const user = await User.exists({ _id: id });

            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            const pedido = await Order.findOne({ idUser: id })
                .sort({ data: -1 })
                .select('numeroPedido valorTotal formaPagamento frete data idEndereco status produtos')
                .populate({
                    path: 'produtos.idProduto',
                    select: 'nome images',
                    options: { lean: true }
                })
                .lean();

            if (!pedido) {
                return res.status(404).json({ msg: 'Pedido não encontrado!' });
            }

            const pedidoOrganizado = {
                id: pedido._id,
                numeroPedido: pedido.numeroPedido,
                data: pedido.data,
                formaPagamento: pedido.formaPagamento,
                status: pedido.status,
                produtos: pedido.produtos.map(produto => ({
                    id: produto.idProduto._id,
                    nome: produto.idProduto.nome,
                    quantidade: produto.quantidade,
                    imagem: produto.idProduto.images[0]
                }))
            };

            res.status(200).json(pedidoOrganizado);

        } catch (error) {
            res.status(500).json({ msg: 'Erro ao buscar pedido!' });
        }
    });

    app.get('/admin-buscar-pedidos', checkPermision('adm'), async (req, res) => {
        try {
            const { q, sort } = req.query;

            const usuariosEncontrados = await User.find({
                $or: [
                    { nome: { $regex: new RegExp(q, 'i') } },
                    { email: { $regex: new RegExp(q, 'i') } },
                    { cpf: { $regex: new RegExp(q, 'i') } }
                ]
            }, '_id');

            const userIds = usuariosEncontrados.map(user => user._id);

            const searchCriterio = {
                $or: [
                    ...(isNaN(q) ? [] : [{ numeroPedido: parseInt(q, 10) }]),
                    { formaPagamento: { $regex: new RegExp(q, 'i') } },
                    { status: { $regex: new RegExp(q, 'i') } },
                    { idUser: { $in: userIds } }
                ]
            };

            let sortOption = {};
            if (sort) {
                const sortOrder = sort.startsWith('-') ? -1 : 1;
                const sortField = sort.replace('-', '');

                if (sortField === 'data') {
                    sortOption = { data: sortOrder };
                } else if (sortField === 'preco') {
                    sortOption = { valorTotal: sortOrder };
                } else {
                    sortOption = { [sortField]: sortOrder };
                }
            }

            if (!q) {
                const pedidos = await Order.find()
                    .populate('idUser', 'nome email cpf')
                    .populate('produtos.idProduto', 'nome preco precoPrazo images')
                    .sort(sortOption)
                    .lean();

                if (!pedidos || pedidos.length === 0) {
                    return res.status(404).json({ msg: 'Nenhum pedido encontrado!' });
                }

                return res.status(200).json(pedidos);
            }

            const pedidos = await Order.find(searchCriterio)
                .populate('idUser', 'nome email cpf')
                .populate('produtos.idProduto', 'nome preco precoPrazo images')
                .sort(sortOption)
                .lean();

            if (!pedidos || pedidos.length === 0) {
                return res.status(404).json({ msg: 'Nenhum pedido encontrado!' });
            }

            res.status(200).json(pedidos);
        } catch (error) {
            console.error('Erro ao realizar a busca:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    });

    app.patch('/trocar-status-pedido', checkPermision('adm'), async (req, res) => {
        const { idPedido, novoStatus } = req.body;

        try {
            const pedido = await Order.findById(idPedido);

            if (!pedido) {
                return res.status(404).json({ msg: 'Pedido não encontrado!' });
            }

            pedido.status = novoStatus;

            await pedido.save();

            res.status(200).json({ msg: 'Status do pedido atualizado com sucesso', pedido });

        } catch (error) {
            res.status(500).json({ msg: 'Erro ao alterar status!' });
        }
    });

    app.get('/relatorio-vendas', checkPermision('adm'), async (req, res) => {
        try {
            const ano = 2024;
            const { mes = new Date().getMonth() + 1 } = req.query;

            const mesNumerico = parseInt(mes, 10);
            if (isNaN(mesNumerico) || mesNumerico < 1 || mesNumerico > 12) {
                return res.status(400).json({ message: "O parâmetro 'mes' deve ser um número entre 1 e 12." });
            }

            const inicioDoMes = new Date(ano, mesNumerico - 1, 1);
            const fimDoMes = new Date(ano, mesNumerico, 0, 23, 59, 59);

            const vendasDiarias = await Order.aggregate([
                {
                    $match: {
                        data: { $gte: inicioDoMes, $lte: fimDoMes },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$data" } },
                        total: { $sum: "$valorTotal" },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
            ]);

            const resultado = vendasDiarias.map((venda) => ({
                dia: venda._id,
                total: venda.total,
            }));

            res.json(resultado);
        } catch (error) {
            console.error("Erro ao buscar vendas:", error);
            res.status(500).json({ message: "Erro ao buscar vendas" });
        }
    });

}

module.exports = { orderController };   