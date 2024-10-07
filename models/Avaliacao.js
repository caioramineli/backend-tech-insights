const mongoose = require('mongoose')

const Avaliacao = mongoose.model('Avaliacao', {
    nota: { type: Number, required: true },
    titulo: { type: String, required: true },
    descricao: { type: String, required: true },
    data: { type: Date, required: true },
    user: {
        id: { type: String, required: true },
        nome: { type: String, required: true },
        email: { type: String, required: true }
    },
    idProduto: { type: String, required: true }
})

module.exports = Avaliacao