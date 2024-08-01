const mongoose = require('mongoose')

const Product = mongoose.model('Product', {
    nome: { type: String, required: true },
    precoPrazo: { type: Number, required: true },
    preco: { type: Number, required: true },
    descricao: { type: String, required: true },
    especificacoes: { type: String, required: true },
    marca: { type: String, required: true },
    categoria: { type: String, required: true },
    img1: { type: String, required: true },
    img2: { type: String, required: true },
    img3: { type: String, required: true },
    img4: { type: String, required: true },
    img5: { type: String, required: true },
    estoque: { type: Number, required: true }
})

module.exports = Product;