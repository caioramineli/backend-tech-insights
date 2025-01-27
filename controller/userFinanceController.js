const jwt = require('jsonwebtoken');
const UserFinance = require('../models/UserFinance')
const mongoose = require('mongoose')
const authMiddleware = require('../auth/checkToken')

function userFinanceController(app) {
    app.post('/user-register', async (req, res) => {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(422).json({ msg: "Preencha todos os campos!" });
        }

        const emailExists = await UserFinance.findOne({ email: email })

        if (emailExists) {
            return res.status(422).json({ msg: "E-mail já cadastrado!" })
        }

        const user = new UserFinance({
            name,
            email,
            password
        })

        try {
            await user.save()
            res.status(201).json({ msg: 'Usuário criado com sucesso!' })

        } catch (error) {
            res.status(500).json({ msg: "Erro no servidor!" })
        }
    })

    app.post("/auth", async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(422).json({ msg: "Preencha todos os campos!" });
        }

        const user = await UserFinance.findOne({ email: email });

        if (user && user.password === password) {
            try {
                const secret = process.env.SECRET;
                const token = jwt.sign(
                    {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                    },
                    secret,
                    { expiresIn: '30d' }
                );

                res.status(200).json({ msg: 'Autenticação realizada com sucesso!', token });

            } catch (error) {
                console.log(error);
                res.status(500).json({ msg: "Erro no servidor!" });
            }
        } else {
            res.status(404).json({ msg: "Email ou senha inválidos!" });
        }
    });

    app.get('/get-user', authMiddleware, async (req, res) => {
        const user = await UserFinance.findById(req.userId, '-password')

        if (!user) {
            return res.status(404).json({ msg: "Usuário não encontrado!" })
        }

        try {
            res.status(200).json(user)
        } catch (error) {
            res.status(500).json({ msg: "Erro no servidor!" })
        }
    })
}

module.exports = { userFinanceController };