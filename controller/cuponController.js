const Cupon = require('../models/Cupon')
const checkPermision = require('../config/checkPermision');

function cuponController(app) {

    app.post('/cupon/create', checkPermision('adm'), async (req, res) => {
        const { codigo, descricao, tipo, valor, valorMinimoDoCarrinho, quantidade, validade } = req.body;

        try {
            const codigoCupomExists = await Cupon.findOne({ codigo: { $regex: new RegExp(`^${codigo}$`, 'i') } });

            if (codigoCupomExists) {
                return res.status(422).json({ msg: "Código já cadastrado!" });
            }

            const novoCupom = new Cupon({
                codigo,
                descricao,
                tipo,
                valor,
                valorMinimoDoCarrinho,
                quantidade,
                validade: new Date(`${validade}T23:59:00.000Z`)
            });

            await novoCupom.save();

            return res.status(201).json({ msg: "Cupom criado com sucesso!" });

        } catch (error) {
            console.error("Erro ao criar cupom:", error);
            return res.status(500).json({ msg: "Erro ao criar o cupom." });
        }
    });

    app.get("/listar-cupons", async (req, res) => {
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

            if (cupom.quantidade < 1) {
                return res.status(400).json({ msg: "Cupom esgotado!" });
            }

            res.status(200).json({
                codigo,
                tipo: cupom.tipo,
                desconto: cupom.valor,
                minimo: cupom.valorMinimoDoCarrinho,
                msg: "Cupom válido!"
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });

    app.put('/atualizar-cupom', checkPermision('adm'), async (req, res) => {
        const { _id, codigo, descricao, tipo, valor, valorMinimoDoCarrinho, quantidade, validade } = req.body;

        try {
            const cupom = await Cupon.findById(_id);

            if (!cupom) {
                return res.status(404).json({ msg: "Cupom não encontrado!" });
            }

            cupom.descricao = descricao
            cupom.tipo = tipo
            cupom.valor = valor
            cupom.valorMinimoDoCarrinho = valorMinimoDoCarrinho
            cupom.quantidade = quantidade
            cupom.validade = validade ? new Date(`${validade}T23:59:00.000Z`) : null;

            if (cupom.codigo === codigo) {

                await cupom.save();

                res.status(200).json({ msg: 'Cupom atualizado com sucesso!' });
            } else {
                const codigoCupomExists = await Cupon.findOne({ codigo: { $regex: new RegExp(`^${codigo}$`, 'i') } });

                if (codigoCupomExists) {
                    return res.status(422).json({ msg: "Código já cadastrado!" });
                }

                cupom.codigo = codigo

                await cupom.save();

                res.status(200).json({ msg: 'Cupom atualizado com sucesso!' });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao atualizar cupom!' });
        }
    });

    app.delete('/excluir-cupom', checkPermision('adm'), async (req, res) => {
        const { cupomId } = req.body;

        try {
            const cupom = await Cupon.findByIdAndDelete(cupomId);

            if (!cupom) {
                return res.status(404).json({ msg: 'Cupom não encontrado!' });
            }

            res.status(200).json({ msg: 'Cupom excluido com sucesso!' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao excluir cupom!' });
        }
    });
}

module.exports = { cuponController };