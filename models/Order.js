const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    data: {
        type: Date,
        default: Date.now,
        index: true
    },
    numeroPedido: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    idUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
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
        type: String,
        required: true
    },
    formaPagamento: {
        type: String,
        required: true
    },
    desconto: {
        type: Number,
        default: 0
    },
    frete: {
        tipo: {
            type: String,
            required: true
        },
        valor: {
            type: Number,
            required: true,
            default: 0
        }
    },
    valorTotal: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'Pedido Realizado'
    }
});


orderSchema.index({ idUser: 1, data: -1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
