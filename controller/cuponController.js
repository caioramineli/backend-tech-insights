const Cupon = require('../models/Cupon')

function cuponController(app) {

    app.post('/cupon/create', async (req, res) => {
        const { codigo, descricao, tipo, valor, valorMinimoDoCarrinho, quantidade, validade } = req.body;

        const cupon = new Cupon({
            codigo,
            descricao,
            tipo,
            valor,
            valorMinimoDoCarrinho,
            quantidade,
            validade
        });

        try {
            await cupon.save()
            res.status(201).json({ msg: 'Cupom cadastrado com sucesso!' })

        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: "Erro ao cadastrar cupom!" })
        }
    })

    app.get("/cupon/listar", async (req, res) => {
        try {
            const cupons = await Cupon.find();
            if (cupons.length === 0) {
                return res.status(404).json({ msg: "Nenhum cupom encontrado!" });
            }
            res.status(200).json({ cupons });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });

    app.get('/cupon/:codigo', async (req, res) => {
        const codigo = req.params.codigo;

        try {
            const cupom = await Cupon.findOne({ codigo });

            if (!cupom) {
                return res.status(404).json({ msg: "Cupom não encontrado!" });
            }

            const hoje = new Date();
            if (cupom.validade && cupom.validade < hoje) {
                return res.status(400).json({ msg: "Cupom expirado!" });
            }

            res.status(200).json({ desconto: cupom.valor, msg: "Cupom válido!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });
}

module.exports = { cuponController };