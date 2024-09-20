const mongoose = require('mongoose')

const User = mongoose.model('User', {
    nome: String,
    cpf: String,
    dataNascimento: String,
    telefone: String,
    email: String,
    senha: String,
    favoritos: Array
})

module.exports = User