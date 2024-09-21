const mongoose = require('mongoose');

// Esquema de endereço separado
const enderecoSchema = new mongoose.Schema({
    nome: String,
    cep: String,
    rua: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String,
}, { _id: false }); // Desabilitar o campo _id em endereços individuais

// Esquema de usuário
const userSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cpf: { type: String, required: true },
    dataNascimento: { type: String, required: true },
    telefone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    enderecos: { type: [enderecoSchema], default: [] },
    favoritos: { type: [String], default: [] }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
