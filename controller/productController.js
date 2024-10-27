const fs = require("fs");
const Product = require('../models/Product');
const upload = require('../config/multer');

function productController(app) {
    app.post("/product/create", upload.array("images", 5), async (req, res) => {
        if (!req.files || req.files.length < 1 || req.files.length > 5) {
            if (req.files) {
                req.files.forEach(file => fs.unlink(file.path, err => {
                    if (err) console.error(`Erro ao deletar o arquivo: ${file.path}`);
                }));
            }
            return res.status(400).json({ msg: "É necessário enviar de 1 a 5 imagens" });
        }

        const {
            nome,
            precoPrazo,
            descricao,
            especificacoes,
            marca,
            categoria,
        } = req.body;

        if (!nome || !precoPrazo || !descricao || !especificacoes || !marca || !categoria) {
            req.files.forEach(file => fs.unlink(file.path, err => {
                if (err) console.error(`Erro ao deletar o arquivo: ${file.path}`);
            }));
            return res.status(400).json({ msg: "Todos os campos são obrigatórios." });
        }

        const imgPaths = req.files.map(file => file.path);

        const images = imgPaths;

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

    app.get("/product", async (req, res) => {
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

    // Pesquisa produtos pelo nome, categoria ou marca e ordena se necessário.
    app.get('/products/search', async (req, res) => {
        try {
            const query = req.query.q;  // Captura a string de consulta (ex: /products/search?q=nome)
            const sort = req.query.sort; // Captura o parâmetro de ordenação (ex: /products/search?q=nome&sort=nome)

            if (!query) {
                return res.status(400).json({ message: 'Parâmetro de consulta não fornecido' });
            }

            const searchCriterio = {
                $or: [
                    { nome: { $regex: new RegExp(query, 'i') } },
                    { categoria: { $regex: new RegExp(query, 'i') } },
                    { marca: { $regex: new RegExp(query, 'i') } }
                ]
            };


            let sortOption = {};
            if (sort) {
                const sortOrder = sort.startsWith('-') ? -1 : 1;
                const sortField = sort.replace('-', '');
                sortOption = { [sortField]: sortOrder };
            }

            const results = await Product.find(searchCriterio).sort(sortOption);

            res.json(results);
        } catch (error) {
            console.error('Erro ao realizar a busca:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    });

    app.post("/product/favoritos", async (req, res) => {
        const favoritos = req.body

        try {

            const products = await Product.find({ _id: { $in: favoritos } });
            if (products.length === 0) {
                return res.status(404).json({ msg: "Nenhum produto encontrado!" });
            }
            res.status(200).json({ products });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });

    app.get('/produtos/:marca', async (req, res) => {
        try {
            const { marca } = req.params;

            const marcaBusca = { marca: { $regex: new RegExp(marca, 'i') } };

            const produtos = await Product.find(marcaBusca);

            res.status(200).json(produtos);
        } catch (error) {
            console.error('Erro ao realizar a busca:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    });

    app.get('/produtos/categoria/:categoria', async (req, res) => {
        try {
            const { categoria } = req.params;
            const sort = req.query.sort;

            const categoriaBusca = { categoria: { $regex: new RegExp(categoria, 'i') } };

            let sortOption = {};
            if (sort) {
                const sortOrder = sort.startsWith('-') ? -1 : 1;
                const sortField = sort.replace('-', '');
                sortOption = { [sortField]: sortOrder };
            }

            const produtos = await Product.find(categoriaBusca).sort(sortOption);

            res.status(200).json(produtos);
        } catch (error) {
            console.error('Erro ao realizar a busca:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    });

    app.get("/productHome", async (req, res) => {
        try {
            const { divisao } = req.query;

            const allProducts = await Product.find();

            const primeiraParte = allProducts.slice(0, divisao);
            const segundaParte = allProducts.slice(divisao);

            if (allProducts.length === 0) {
                return res.status(404).json({ msg: "Nenhum produto encontrado!" });
            }

            res.status(200).json({
                primeirosProdutos: primeiraParte,
                restanteProdutos: segundaParte
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });

    app.post('/listar-grupo-produtos', async (req, res) => {
        try {
            const { categorias } = req.body;
            const sort = req.query.sort;

            if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
                return res.status(400).json({ message: 'É necessário fornecer uma lista de categorias.' });
            }

            const categoriaBusca = { categoria: { $in: categorias.map(cat => new RegExp(cat, 'i')) } };

            let sortOption = {};
            if (sort) {
                const sortOrder = sort.startsWith('-') ? -1 : 1;
                const sortField = sort.replace('-', '');
                sortOption = { [sortField]: sortOrder };
            }

            const produtos = await Product.find(categoriaBusca).sort(sortOption);

            res.status(200).json(produtos);
        } catch (error) {
            console.error('Erro ao realizar a busca:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    });

}

module.exports = { productController };
