const mongoose = require('mongoose')

const Cupon = mongoose.model('Cupon', {
    codigo: String,
    descricao: String,
    tipo: String,
    valor: Number,
    valorMinimoDoCarrinho: Number,
    quantidade: Number,
    validade: Date
})

module.exports = Cupon