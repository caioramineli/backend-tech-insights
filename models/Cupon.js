const mongoose = require('mongoose')

const Cupon = mongoose.model('Cupon', {
    codigo: {
        type: String,
        required: true,
    },
    descricao: {
        type: String,
        required: true,
    },
    tipo: {
        type: String,
        required: true,
    },
    valor: {
        type: Number,
        required: true,
    },
    valorMinimoDoCarrinho: {
        type: Number,
        required: true,
    },
    quantidade: {
        type: Number,
        required: true,
    },
    validade: {
        type: Date,
        required: true,
    }
})

module.exports = Cupon