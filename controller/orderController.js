const Order = require('../models/Order')

function orderController(app) {

    app.post('/order', async (req, res) => {
        const { idUser, produtos, idEndereco, formaPagamento, desconto, frete, valorTotal } = req.body;

        const order = new Order({
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
            res.status(201).json({ msg: 'Pedido realizado com sucesso!' })

        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: "Erro ao realizar o pedido!" })
        }
    })
}

module.exports = { orderController };