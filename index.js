require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const app = express()
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json())

// app.get('/api/data', (req, res) => {
//     res.json({ message: 'Hello from server!' });
// });

// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });

// Models
const User = require('./models/User')

app.get('/', (req, res) => {
    res.status(200).json({ msg: "Bem vindo a nossa API!" })
})

// Private Route
app.get("/user/:id", checkToken, async (req, res) => {
    const id = req.params.id

    const user = await User.findById(id, '-senha')

    if (!user) {
        return res.status(404).json({ msg: "Usuário não encontrado!" })
    }

    res.status(200).json({ user })
})

function checkToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ msg: "Acesso negado!" })
    }

    try {
        const secret = process.env.SECRET

        jwt.verify(token, secret)

        next()

    } catch (error) {
        res.status(400).json({ msg: "Token inválido!" })
    }
}

app.post('/register', async (req, res) => {
    const { nome, cpf, dataNascimento, telefone, email, senha } = req.body

    // validações
    if (!nome) {
        return res.status(422).json({ msg: "O nome é obrigatório!" })
    }

    if (!cpf) {
        return res.status(422).json({ msg: "O CPF é obrigatório!" })
    }

    if (!dataNascimento) {
        return res.status(422).json({ msg: "A data de nascimento é obrigatório!" })
    }

    if (!telefone) {
        return res.status(422).json({ msg: "O telefone é obrigatório!" })
    }

    if (!email) {
        return res.status(422).json({ msg: "O email é obrigatório!" })
    }

    if (!senha) {
        return res.status(422).json({ msg: "A senha é obrigatório!" })
    }

    const userExists = await User.findOne({ email: email })

    if (userExists) {
        return res.status(422).json({ msg: "E-mail já cadastrado!" })
    }

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(senha, salt)

    const user = new User({
        nome,
        cpf,
        dataNascimento,
        telefone,
        email,
        senha: passwordHash,
    })

    try {
        await user.save()
        res.status(201).json({ msg: 'Usuário criado com sucesso!' })

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Erro no servidor!" })
    }
})

//login
app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    // validações
    if (!email) {
        return res.status(422).json({ msg: "O email é obrigatório!" });
    }

    if (!senha) {
        return res.status(422).json({ msg: "A senha é obrigatória!" });
    }

    // checar se o usuario existe
    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(404).json({ msg: "Usuário não encontrado!" });
    }

    const checkPassword = await bcrypt.compare(senha, user.senha);

    if (!checkPassword) {
        return res.status(422).json({ msg: "Senha Inválida!" });
    }

    try {
        const secret = process.env.SECRET;
        const token = jwt.sign(
            {
                id: user._id,
                nome: user.nome // Adicione o nome do usuário no token
            },
            secret,
        );

        res.status(200).json({ msg: 'Autenticação realizada com sucesso!', token });

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Erro no servidor!" });
    }
});

const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.yjh5qvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).then(() => {
    app.listen(port)
    console.log("Conectou!!");
}).catch((err) => console.log(err))

