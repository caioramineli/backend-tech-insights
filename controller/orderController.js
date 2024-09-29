const Order = require('../models/Order')
const User = require('../models/User')

function orderController(app) {

    app.post('/order', async (req, res) => {
        const { idUser, produtos, idEndereco, formaPagamento, desconto, frete, valorTotal } = req.body;
        const numeroPedido = Math.floor(Math.random() * 1000000);

        const order = new Order({
            numeroPedido: numeroPedido,
            idUser,
            produtos,
            idEndereco,
            formaPagamento,
            desconto,
            frete,
            valorTotal,
            data: new Date()
        });

        try {
            await order.save()
            res.status(201).json({ msg: 'Pedido realizado com sucesso!', order })

        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: "Erro ao realizar o pedido!" })
        }
    })

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
                .select('frete data produtos idEndereco formaPagamento desconto valorTotal');

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
}

module.exports = { orderController };   