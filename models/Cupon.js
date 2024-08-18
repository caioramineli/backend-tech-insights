const mongoose = require('mongoose')

const Cupon = mongoose.model('Cupon', {
    codigo: String,
    descricao: String,
    tipo: String,
    valor: Number,
    status: String,
})

module.exports = Cupon