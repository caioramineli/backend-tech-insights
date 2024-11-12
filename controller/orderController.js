const Order = require('../models/Order')
const User = require('../models/User')
const Cupon = require('../models/Cupon')
const checkPermision = require('../config/checkPermision');

function orderController(app) {

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

            let cupom = null;
            if (codigoCupom) {
                cupom = await Cupon.findOne({ codigo: codigoCupom });
            }

            if (cupom) {
                cupom.quantidade -= 1;
                await cupom.save();
            }

            res.status(201).json({ msg: 'Pedido realizado com sucesso!', order });
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
                .populate({
                    path: 'produtos.idProduto',
                    select: 'nome images'
                })
                .select('numeroPedido valorTotal formaPagamento frete data idEndereco status produtos');

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

            res.json(pedidosOrganizados);
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

            res.json(pedidoOrganizado);

        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao buscar pedido!' });
        }
    });

    app.get('/user/:id/last-order', checkPermision('normal'), async (req, res) => {
        const { id } = req.params;

        try {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            const pedido = await Order.findOne({ idUser: id })
                .sort({ data: -1 })
                .populate({
                    path: 'produtos.idProduto',
                    select: 'nome images'
                })
                .select('numeroPedido valorTotal formaPagamento frete data idEndereco status produtos');

            if (!pedido) {
                return res.status(404).json({ msg: 'Pedido não encontrado!' });
            }

            const pedidoOrganizado = {
                id: pedido._id,
                numeroPedido: pedido.numeroPedido,
                data: pedido.data,
                formaPagamento: pedido.formaPagamento,
                id: pedido._id,
                status: pedido.status,
                produtos: pedido.produtos.map(produto => ({
                    id: produto.idProduto._id,
                    nome: produto.idProduto.nome,
                    quantidade: produto.quantidade,
                    imagem: produto.idProduto.images[0]
                }))
            };

            res.json(pedidoOrganizado);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: 'Erro ao buscar pedido!' });
        }
    });
}

module.exports = { orderController };   