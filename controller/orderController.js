const Order = require('../models/Order')

function orderController(app) {

    app.post('/order', async (req, res) => {
        const { id_user, produtos, id_endereco, forma_pagamento, desconto, frete, valor_total } = req.body;

        const order = new Order({
            id_user,
            produtos,
            id_endereco,
            forma_pagamento,
            desconto,
            frete,
            valor_total,
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