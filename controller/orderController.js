const Order = require('../models/Order')
const User = require('../models/User')
const Cupon = require('../models/Cupon')

function orderController(app) {

    app.post('/order', async (req, res) => {
        const { idUser, produtos, idEndereco, formaPagamento, desconto, frete, valorTotal, codigoCupom } = req.body;
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
                data: new Date()
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


    app.get('/user/:id/orders', async (req, res) => {
        const { id } = req.params;

        try {
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            const pedidos = await Order.find({ idUser: id })
                .populate({
                    path: 'produtos.idProduto',
                    select: 'nome precoPrazo preco marca images'
                })
                .select('frete numeroPedido data produtos idEndereco formaPagamento desconto valorTotal');

            const pedidosOrganizados = pedidos.map(pedido => ({
                ...pedido.toObject(),
                produtos: pedido.produtos.map(produto => ({
                    dadosProduto: produto.idProduto,
                    quantidade: produto.quantidade
                }))
            }));

            res.json(pedidosOrganizados);

        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao buscar pedidos!' });
        }
    });

    app.get('/user/:id/orders/:orderId', async (req, res) => {
        const { id, orderId } = req.params;

        try {
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            const pedido = await Order.findOne({ idUser: id, _id: orderId })
                .populate({
                    path: 'produtos.idProduto',
                    select: 'nome precoPrazo preco marca images'
                })
                .select('frete numeroPedido data produtos idEndereco formaPagamento desconto valorTotal');

            if (!pedido) {
                return res.status(404).json({ msg: 'Pedido não encontrado!' });
            }

            const pedidoOrganizado = {
                ...pedido.toObject(),
                produtos: pedido.produtos.map(produto => ({
                    dadosProduto: produto.idProduto,
                    quantidade: produto.quantidade
                }))
            };

            res.json(pedidoOrganizado);

        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao buscar pedido!' });
        }
    });

}

module.exports = { orderController };   