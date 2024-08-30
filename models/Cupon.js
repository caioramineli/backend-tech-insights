const mongoose = require('mongoose')

const Cupon = mongoose.model('Cupon', {
    codigo: String,
    descricao: String,
    valor: Number,
    status: Boolean,
    quantidade: Number,
    validade: Date
})

module.exports = Cupon