const mongoose = require('mongoose');

const movimentoEstoqueSchema = new mongoose.Schema({
    produtoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
        required: true
    },
    quantidade: {
        type: Number,
        required: true
    },
    dataMovimento: {
        type: Date,
        default: Date.now
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const MovimentoEstoque = mongoose.model('MovimentoEstoque', movimentoEstoqueSchema);

module.exports = MovimentoEstoque;
