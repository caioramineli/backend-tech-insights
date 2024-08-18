const mongoose = require('mongoose')

const Order = mongoose.model('Order', {
    data: Date,
    id_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    produtos: [{
        id_produto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantidade: {
            type: Number,
            required: true
        }
    }],
    id_endereco: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    forma_pagamento: String,
    desconto: Number,
    frete: Number,
    valor_total: Number,
})

module.exports = Order