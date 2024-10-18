const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('../models/User')

function userController(app) {
    app.get('/', (req, res) => {
        res.status(200).json({ msg: "Bem vindo!" });
    });

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

    app.put('/user/:id', async (req, res) => {
        const { id } = req.params;
        const { nome, dataNascimento, telefone, email } = req.body

        try {
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            user.nome = nome;
            user.dataNascimento = dataNascimento;
            user.telefone = telefone;
            user.email = email;

            await user.save();

            res.status(200).json({ msg: 'Usuário atualizado com sucesso!', enderecos: user.enderecos });
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao atualizar o usuário!' });
        }
    })

    app.put('/user/:id/password', async (req, res) => {
        const { id } = req.params;
        const { senha, novaSenha } = req.body

        try {
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            const checkPassword = await bcrypt.compare(senha, user.senha);

            if (!checkPassword) {
                return res.status(422).json({ msg: "Senha incorreta!" });
            }

            user.senha = await bcrypt.hash(novaSenha, 12);

            await user.save();

            res.status(200).json({ msg: 'Senha atualizada com sucesso!', enderecos: user.enderecos });
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao atualizar o usuário!' });
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
                    nome: user.nome,
                    email: user.email,
                    cpf: user.cpf
                },
                secret,
            );

            res.status(200).json({ msg: 'Autenticação realizada com sucesso!', token });

        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });

    app.post('/user/:id/endereco', async (req, res) => {
        const { id } = req.params;
        const novoEndereco = req.body;

        try {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            user.enderecos.push(novoEndereco);
            await user.save();

            res.status(200).json({ msg: 'Endereço adicionado com sucesso!', enderecos: user.enderecos });
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao adicionar endereço!' });
        }
    });

    app.get('/user/:id/endereco', async (req, res) => {
        const { id } = req.params;

        try {
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            res.status(200).json({ enderecos: user.enderecos });
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao buscar endereços!' });
        }
    });

    app.put('/user/:id/endereco/:idEndereco', async (req, res) => {
        const { id, idEndereco } = req.params;
        const { nome, cep, rua, numero, complemento, bairro, cidade, estado } = req.body;

        try {
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            const endereco = user.enderecos.id(idEndereco);

            if (!endereco) {
                return res.status(404).json({ msg: 'Endereço não encontrado!' });
            }

            endereco.nome = nome;
            endereco.cep = cep;
            endereco.rua = rua;
            endereco.numero = numero;
            endereco.complemento = complemento;
            endereco.bairro = bairro;
            endereco.cidade = cidade;
            endereco.estado = estado;

            await user.save();

            res.status(200).json({ msg: 'Endereço atualizado com sucesso!', enderecos: user.enderecos });
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao atualizar o endereço!' });
        }
    });


    app.delete('/user/:id/endereco/:enderecoId', async (req, res) => {
        const { id, enderecoId } = req.params;

        try {
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            user.enderecos.pull({ _id: enderecoId });

            await user.save();

            res.status(200).json({ msg: 'Endereço removido com sucesso!', enderecos: user.enderecos });
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao remover o endereço!' });
        }
    });

    app.post('/user/:id/favorito/:idProduto', async (req, res) => {
        const { id, idProduto } = req.params;

        try {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            const productExists = user.favoritos.includes(idProduto);

            if (productExists) {
                user.favoritos = user.favoritos.filter(fav => fav !== idProduto);
                await user.save();
                return res.status(200).json({ msg: 'Produto removido dos favoritos!', favoritos: user.favoritos });
            }

            user.favoritos.push(idProduto);
            await user.save();

            res.status(200).json({ msg: 'Produto adicionado aos favoritos!', favoritos: user.favoritos });
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao favoritar!' });
        }
    });

    app.get('/user/:id/favoritos', async (req, res) => {
        const { id } = req.params;

        try {
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            res.status(200).json({ favoritos: user.favoritos });
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: 'Erro ao buscar os favoritos!' });
        }
    });
}

module.exports = { userController };