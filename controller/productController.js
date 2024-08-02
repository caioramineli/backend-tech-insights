const fs = require("fs");
const Product = require('../models/Product')
const upload = require('../config/multer');

function productController(app) {
    app.post("/product/create", upload.array("images", 5), async (req, res) => {
        if (!req.files || req.files.length !== 5) {
            if (req.files) {
                req.files.forEach(file => fs.unlink(file.path, err => {
                    if (err) console.error(`Erro ao deletar o arquivo: ${file.path}`);
                }));
            }
            return res.status(400).json({ msg: "Exatamente 5 imagens são necessárias" });
        }

        const {
            nome,
            precoPrazo,
            preco,
            descricao,
            especificacoes,
            marca,
            categoria,
            estoque
        } = req.body;

        const imgPaths = req.files.map(file => file.path);

        const product = new Product({
            nome,
            precoPrazo,
            preco,
            descricao,
            especificacoes,
            marca,
            categoria,
            img1: imgPaths[0],
            img2: imgPaths[1],
            img3: imgPaths[2],
            img4: imgPaths[3],
            img5: imgPaths[4],
            estoque
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
}

module.exports = { productController };