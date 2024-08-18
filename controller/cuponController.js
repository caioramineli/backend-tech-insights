const Cupon = require('../models/Cupon')

function cuponController(app) {

    app.post('/addrees/create', async (req, res) => {
        const { codigo, descricao, tipo, valor, status } = req.body;

        const cupon = new Cupon({
            codigo,
            descricao,
            tipo,
            valor,
            status,
        });

        try {
            await cupon.save()
            res.status(201).json({ msg: 'Cupom cadastrado com sucesso!' })

        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: "Erro ao cadastrar cupom!" })
        }
    })
}

module.exports = { cuponController };