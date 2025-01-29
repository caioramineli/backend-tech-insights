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
            res.status(201).json({ contact, msg: 'Contato criado com sucesso!' })

        } catch (error) {
            res.status(500).json({ msg: "Erro no servidor!" })
        }
    })

    app.get('/get-contacts-by-user', authMiddleware, async (req, res) => {
        const contacts = await Contact.find({ user: req.userId }).select('-user')
        console.log('bateu aqui');


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
        const contactData = {
            ...req.body,
            id: req.body._id || req.body.id,
        };

        if (!contactData.id || !contactData.name || !contactData.email || !contactData.phone || !contactData.company) {
            return res.status(422).json({ msg: "Preencha todos os campos!" });
        }

        try {
            const contact = await Contact.findById(contactData.id)

            if (!contact) {
                return res.status(404).json({ msg: "Contato não encontrado!" })
            }

            contact.name = contactData.name;
            contact.email = contactData.email;
            contact.phone = contactData.phone;
            contact.company = contactData.company;

            await contact.save();

            res.status(200).json({ contact, msg: 'Contato atualizado com sucesso!' })

        } catch (error) {
            res.status(500).json({ msg: "Erro no servidor!" })
        }
    })

    app.delete('/delete-contact/:contactId', async (req, res) => {
        const { contactId } = req.params

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