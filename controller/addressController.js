const Address = require('../models/Address')

function addressController(app) {

    app.post('/address/create', async (req, res) => {
        const { nome, cep, idUser, rua, numero, complemento, bairro, cidade, estado } = req.body;

        const address = new Address({
            nome,
            cep,
            idUser,
            rua,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
        });

        try {
            await address.save()
            res.status(201).json({ msg: 'Endereço cadastrado com sucesso!' })

        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: "Erro ao cadastrar endereço!" })
        }
    })
}

module.exports = { addressController };