const fs = require("fs");
const Product = require('../models/Product')

function productController(app) {
    app.post('/product/create', async (req, res) => {
        const {
            nome,
            precoPrazo,
            preco,
            descricao,
            especificacoes,
            marca,
            categoria,
            estoque
        } = req.body

        const {
            img1,
            img2,
            img3,
            img4,
            img5,
        } = req.file

        const product = new Product({
            nome,
            precoPrazo,
            preco,
            descricao,
            especificacoes,
            marca,
            categoria,
            img1: img1.path,
            img2: img2.path,
            img3: img3.path,
            img4: img4.path,
            img5: img5.path,
            estoque
        })

        try {
            await product.save();
            res.status(201).json({ msg: 'Produto cadastrado com sucesso!' })
        } catch (error) {
            console.log(error);
            res.status(500).json({ msg: "Erro no servidor!" })
        }
    })

    app.get("/product/:id", async (req, res) => {
        const id = req.params.id

        const product = await Product.findById(id)

        if (!product) {
            return res.status(404).json({ msg: "Produto não encontrado!" })
        }

        res.status(200).json({ product })
    })
}

module.exports = { productController };