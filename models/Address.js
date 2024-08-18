const mongoose = require('mongoose')

const Address = mongoose.model('Address', {
    nome: String,
    cep: String,
    id_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    rua: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String,
})

module.exports = Address