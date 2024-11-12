const fs = require("fs");
const Product = require('../models/Product');
const upload = require('../config/multer');
const checkPermision = require('../config/checkPermision');

function productController(app) {
    app.post("/criar-produto", upload.array("images", 5), checkPermision('adm'), async (req, res) => {
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

    app.get("/listar-produto/:id", async (req, res) => {
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

    app.get("/listar-produtos", async (req, res) => {
        try {
            const produtos = await Product.find()
                .select('_id nome precoPrazo preco images')
                .slice('images', 1)
                .lean();

            if (produtos.length === 0) {
                return res.status(404).json({ msg: "Nenhum produto encontrado!" });
            }

            res.status(200).json({ produtos });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });

    // Pesquisa produtos pelo nome, categoria ou marca e ordena se necessário.
    app.get('/buscar-produtos', async (req, res) => {
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

            const results = await Product.find(searchCriterio)
                .select('_id nome precoPrazo preco images')
                .slice('images', 1)
                .sort(sortOption)
                .lean();

            res.json(results);
        } catch (error) {
            console.error('Erro ao realizar a busca:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    });

    app.post("/listar-favoritos", checkPermision('normal'), async (req, res) => {
        const favoritos = req.body

        try {
            const produtos = await Product.find({ _id: { $in: favoritos } })
                .select('_id nome precoPrazo preco images')
                .slice('images', 1)
                .lean();

            if (produtos.length === 0) {
                return res.status(404).json({ msg: "Nenhum produto encontrado!" });
            }

            res.status(200).json({ produtos });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });

    app.get('/listar-produtos-por-marca/:marca', async (req, res) => {
        try {
            const { marca } = req.params;

            const marcaBusca = { marca: { $regex: new RegExp(marca, 'i') } };

            const produtos = await Product.find(marcaBusca)
                .select('_id nome precoPrazo preco images')
                .slice('images', 1)
                .lean();

            res.status(200).json(produtos);
        } catch (error) {
            console.error('Erro ao realizar a busca:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    });

    app.get('/listar-produtos-por-categoria/:categoria', async (req, res) => {
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

            const produtos = await Product.find(categoriaBusca)
                .select('_id nome precoPrazo preco images')
                .slice('images', 1)
                .sort(sortOption)
                .lean();

            res.status(200).json(produtos);
        } catch (error) {
            console.error('Erro ao realizar a busca:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    });

    app.get("/listar-produtos-home", async (req, res) => {
        try {
            const { divisao } = req.query;

            const produtos = await Product.find()
                .select('_id nome precoPrazo preco images')
                .slice('images', 1)
                .lean();

            if (produtos.length === 0) {
                return res.status(404).json({ msg: "Nenhum produto encontrado!" });
            }

            const primeiraParte = produtos.slice(0, divisao);
            const segundaParte = produtos.slice(divisao);

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

            if (!categorias || categorias.length === 0) {
                return res.status(400).json({ message: 'É necessário fornecer uma lista de categorias.' });
            }

            const categoriaBusca = { categoria: { $in: categorias.map(cat => new RegExp(cat, 'i')) } };

            let sortOption = {};
            if (sort) {
                const sortOrder = sort.startsWith('-') ? -1 : 1;
                const sortField = sort.replace('-', '');
                sortOption = { [sortField]: sortOrder };
            }

            const produtos = await Product.find(categoriaBusca)
                .select('_id nome precoPrazo preco images')
                .slice('images', 1)
                .sort(sortOption)
                .lean();

            res.status(200).json(produtos);
        } catch (error) {
            console.error('Erro ao realizar a busca:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    });

}

module.exports = { productController };
