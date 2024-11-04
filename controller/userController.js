const bcrypt = require('bcrypt')
const checkPermision = require('../config/checkPermision');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const User = require('../models/User')

function userController(app) {
    app.get('/', (req, res) => {
        res.status(200).json({ msg: "Bem vindo!" });
    });

    app.get("/user/:id", checkPermision('normal'), async (req, res) => {
        const id = req.params.id

        const user = await User.findById(id, '-senha')

        if (!user) {
            return res.status(404).json({ msg: "Usuário não encontrado!" })
        }

        res.status(200).json({ user })
    })

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

    app.put('/user/:id', checkPermision('normal'), async (req, res) => {
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

    app.put('/user/:id/password', checkPermision('normal'), async (req, res) => {
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
            const roleType = user.email.endsWith(process.env.ADMIN_EMAILS) ? 'adm' : 'normal';

            const secret = process.env.SECRET;
            const token = jwt.sign(
                {
                    id: user._id,
                    nome: user.nome,
                    email: user.email,
                    cpf: user.cpf,
                    role: roleType
                },
                secret,
                { expiresIn: '7d' }
            );

            res.status(200).json({ msg: 'Autenticação realizada com sucesso!', token });

        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });

    app.post('/user/:id/endereco', checkPermision('normal'), async (req, res) => {
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

    app.get('/user/:id/endereco', checkPermision('normal'), async (req, res) => {
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

    app.put('/user/:id/endereco/:idEndereco', checkPermision('normal'), async (req, res) => {
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


    app.delete('/user/:id/endereco/:enderecoId', checkPermision('normal'), async (req, res) => {
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

    app.post('/user/:id/favorito/:idProduto', checkPermision('normal'), async (req, res) => {
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

    function gerarSenhaAleatoria() {
        const caracteres = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let senha = '';
        for (let i = 0; i < 5; i++) {
            senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        return senha;
    }

    app.post('/recuperar-senha', async (req, res) => {
        const { email } = req.body;

        try {
            const resend = new Resend(process.env.TOKEN_RESEND);

            const user = await User.findOne({ email: email });

            if (!user) {
                return res.status(404).json({ msg: 'Usuário não encontrado!' });
            }

            const novaSenha = gerarSenhaAleatoria();

            user.senha = await bcrypt.hash(novaSenha, 12);

            await user.save();

            const { data, error } = await resend.emails.send({
                from: process.env.EMAIL_ENVIO,
                to: email,
                subject: 'Senha temporária',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                    <style>
                        body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                        }

                        .container {
                        max-width: 800px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                        border: 1px solid gray;
                        }

                        .header {
                        background-color: #059669;
                        color: #ffffff;
                        text-align: center;
                        padding: 0.5rem;
                        font-size: 1rem;
                        }

                        .content {
                        padding: 10px 2rem;
                        line-height: 1.5;
                        color: #333333;
                        font-size: 0.9rem;
                        }

                        #senha {
                        color: #059669;
                        font-weight: bold;
                        }

                        .footer {
                        text-align: center;
                        padding: 1rem;
                        background-color: #f4f4f4;
                        font-size: 0.9rem;
                        color: #777777;
                        }
                    </style>
                    </head>
                    <body>
                    <div class="container">
                        <div class="header">
                        <h1>Senha temporária</h1>
                        </div>
                        <div class="content">
                        <p>Olá,</p>
                        <p>Recebemos uma solicitação para redefinir a sua senha.</p>
                        <p>Essa aqui é uma senha temporária para você utilizar: <span id="senha">\${novaSenha}</span></p>
                        <p>Obrigado,<br>Equipe Tech Insights</p>
                        </div>
                        <div class="footer">
                        <p>Se você tiver alguma dúvida, entre em contato conosco. Este é um e-mail automático, por favor, não responda diretamente.</p>
                        </div>
                    </div>
                    </body>
                    </html>
                    `,
            });

            if (error) {
                return res.status(500).json({ message: 'Erro ao enviar o e-mail', error });
            }

            res.status(200).json({ message: 'E-mail enviado com sucesso!', data });
        } catch (err) {
            res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
        }
    });
}

module.exports = { userController };