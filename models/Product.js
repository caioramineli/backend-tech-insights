const mongoose = require('mongoose')

const Product = mongoose.model('Product', {
    nome: { type: String, required: true },
    precoPrazo: { type: Number, required: true },
    preco: { type: Number, required: true },
    descricao: { type: String, required: true },
    especificacoes: { type: String, required: true },
    marca: { type: String, required: true },
    categoria: { type: String, required: true },
    images: [
        { type: String, required: true },
        { type: String },
        { type: String },
        { type: String },
        { type: String }
    ],
    estoque: { type: Number, required: true }
})

module.exports = Product;