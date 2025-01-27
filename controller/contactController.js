const Contact = require('../models/Contact')
const mongoose = require('mongoose')
const authMiddleware = require('../auth/checkToken.js')

function contactController(app) {
    app.post('/create-contact', authMiddleware, async (req, res) => {
        const { name, email, phone, company } = req.body

        if (!name || !email || !phone || !company) {
            return res.status(422).json({ msg: "Preencha todos os campos!" });
        }

        const contact = new Contact({
            name,
            email,
            phone,
            company,
            user: req.userId
        })

        try {
            await contact.save()
            res.status(201).json({ msg: 'Contato criado com sucesso!' })

        } catch (error) {
            res.status(500).json({ msg: "Erro no servidor!" })
        }
    })

    app.get('/get-contacts-by-user', authMiddleware, async (req, res) => {
        const contacts = await Contact.find({ user: req.userId }).select('-user')

        if (!contacts) {
            return res.status(404).json({ msg: "Nenhum contato encontrado!" })
        }

        try {
            res.status(200).json(contacts)
        } catch (error) {
            res.status(500).json({ msg: "Erro no servidor!" })
        }
    })

    app.put('/update-contact', authMiddleware, async (req, res) => {
        const { id, name, email, phone, company } = req.body

        if (!id || !name || !email || !phone || !company) {
            return res.status(422).json({ msg: "Preencha todos os campos!" });
        }

        try {
            const contact = await Contact.findById(id)

            if (!contact) {
                return res.status(404).json({ msg: "Contato não encontrado!" })
            }

            contact.name = name;
            contact.email = email;
            contact.phone = phone;
            contact.company = company;

            await contact.save();

            res.status(200).json({ msg: 'Contato atualizado com sucesso!' })

        } catch (error) {
            res.status(500).json({ msg: "Erro no servidor!" })
        }
    })

    app.delete('/delete-contact', authMiddleware, async (req, res) => {
        const { contactId } = req.body

        if (!contactId) {
            return res.status(422).json({ msg: "Id não informado!" });
        }

        try {
            const contact = await Contact.findByIdAndDelete(contactId);

            if (!contact) {
                return res.status(404).json({ msg: "Contato não encontrado!" })
            }

            res.status(200).json({ msg: 'Contato excluido com sucesso!' })

        } catch (error) {
            res.status(500).json({ msg: "Erro no servidor!" })
        }
    })
}

module.exports = { contactController };