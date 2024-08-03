const fs = require("fs");
const Product = require('../models/Product');
const upload = require('../config/multer');

function productController(app) {
    app.post("/product/create", upload.array("images", 5), async (req, res) => {
        if (!req.files || (req.files.length !== 4 && req.files.length !== 5)) {
            if (req.files) {
                req.files.forEach(file => fs.unlink(file.path, err => {
                    if (err) console.error(`Erro ao deletar o arquivo: ${file.path}`);
                }));
            }
            return res.status(400).json({ msg: "São necessárias 4 ou 5 imagens" });
        }

        const {
            nome,
            precoPrazo,
            descricao,
            especificacoes,
            marca,
            categoria,
        } = req.body;

        const imgPaths = req.files.map(file => file.path);

        const images = imgPaths; 

        if (req.files.length === 5) {
            images.img5 = imgPaths[4];
        }

        const product = new Product({
            nome,
            precoPrazo,
            preco: precoPrazo - precoPrazo * 0.1,
            descricao,
            especificacoes,
            marca,
            categoria,
            images,
            estoque: 0
        });

        try {
            await product.save();
            res.status(201).json({ msg: "Produto cadastrado com sucesso!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });

    app.get("/product/:id", async (req, res) => {
        const id = req.params.id;

        try {
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({ msg: "Produto não encontrado!" });
            }
            res.status(200).json({ product });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });

    app.get("/product/", async (req, res) => {

        try {
            const products = await Product.find();
            if (products.length === 0) {
                return res.status(404).json({ msg: "Nenhum produto encontrado!" });
            }
            res.status(200).json({ products });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });

}

module.exports = { productController };