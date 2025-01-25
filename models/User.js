const mongoose = require('mongoose');

const enderecoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cep: { type: String, required: true },
    rua: { type: String, required: true },
    numero: { type: String, required: true },
    complemento: { type: String, required: false },
    bairro: { type: String, required: true },
    cidade: { type: String, required: true },
    estado: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },
    dataNascimento: { type: String, required: true },
    telefone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    enderecos: { type: [enderecoSchema], default: [] },
    favoritos: { type: [String], default: [] }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
