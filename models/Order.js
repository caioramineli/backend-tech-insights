const mongoose = require('mongoose')

const Order = mongoose.model('Order', {
    data: Date,
    numeroPedido: Number,
    idUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    produtos: [{
        idProduto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantidade: {
            type: Number,
            required: true
        },
        _id: false
    }],
    idEndereco: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    formaPagamento: String,
    desconto: Number,
    frete: {
        tipo: String,
        valor: Number
    },
    valorTotal: Number,
});

module.exports = Order;
