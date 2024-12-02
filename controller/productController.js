const fs = require("fs");
const Product = require('../models/Product');
const upload = require('../config/multer');
const createAccentInsensitiveRegex = require('../utils/addAccent');
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
            estoque: 1,
            status: 'ativo'
        });

        try {
            await product.save();
            res.status(201).json({ msg: "Produto cadastrado com sucesso!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });

    app.put("/atualizar-produto/:id", upload.array("images", 5), checkPermision("adm"), async (req, res) => {
        const { id } = req.params;

        const {
            nome,
            precoPrazo,
            descricao,
            especificacoes,
            marca,
            categoria,
        } = req.body;

        if (!nome || !precoPrazo || !descricao || !especificacoes || !marca || !categoria) {
            if (req.files) {
                req.files.forEach(file =>
                    fs.unlink(file.path, err => {
                        if (err) console.error(`Erro ao deletar o arquivo: ${file.path}`);
                    })
                );
            }
            return res.status(400).json({ msg: "Todos os campos são obrigatórios." });
        }

        if (req.files && req.files.length > 5) {
            req.files.forEach(file =>
                fs.unlink(file.path, err => {
                    if (err) console.error(`Erro ao deletar o arquivo: ${file.path}`);
                })
            );
            return res.status(400).json({ msg: "É necessário enviar no máximo 5 imagens." });
        }

        const newImgPaths = req.files && req.files.length > 0 ? req.files.map(file => file.path) : null;

        try {
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({ msg: "Produto não encontrado." });
            }

            if (newImgPaths) {
                product.images.forEach(imagePath => {
                    fs.unlink(imagePath, err => {
                        if (err) console.error(`Erro ao deletar a imagem antiga: ${imagePath}`);
                    });
                });
                product.images = newImgPaths;
            }

            product.nome = nome;
            product.precoPrazo = precoPrazo;
            product.preco = precoPrazo - precoPrazo * 0.1;
            product.descricao = descricao;
            product.especificacoes = especificacoes;
            product.marca = marca;
            product.categoria = categoria;

            await product.save();

            res.status(200).json({ msg: "Produto atualizado com sucesso!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Erro no servidor." });
        }
    }
    );

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
            const produtos = await Product.find({
                estoque: { $gte: 1 },
                status: "ativo"
            })
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
            const query = req.query.q;  // Parâmetro de consulta
            const sort = req.query.sort;  // Parâmetro de ordenação

            if (!query) {
                return res.status(400).json({ message: 'Parâmetro de consulta não fornecido' });
            }

            const createAccentInsensitiveRegex = (text) => {
                return new RegExp(text, 'i');
            };

            const regex = createAccentInsensitiveRegex(query);

            const busca = {
                estoque: { $gte: 1 },
                status: "ativo",
                $or: [
                    { nome: { $regex: regex } },
                    { categoria: { $regex: regex } },
                    { marca: { $regex: regex } }
                ]
            };

            let sortOption = {};
            if (sort) {
                const sortOrder = sort.startsWith('-') ? -1 : 1;
                const sortField = sort.replace('-', '');
                sortOption = { [sortField]: sortOrder };
            }

            const results = await Product.find(busca)
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

            const marcaBusca = {
                marca: { $regex: new RegExp(marca, 'i') },
                estoque: { $gte: 1 },
                status: "ativo",
            };

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

            const categoriaBusca = {
                categoria: { $regex: new RegExp(categoria, 'i') },
                estoque: { $gte: 1 },
                status: "ativo",
            };

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

            const produtos = await Product.find({ estoque: { $gte: 1 }, status: "ativo" })
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

            const categoriaBusca = {
                $and: [
                    { categoria: { $in: categorias.map(cat => new RegExp(cat, 'i')) } },
                    { estoque: { $gte: 1 } },
                    { status: "ativo" }
                ]
            };

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

    app.get('/admin-buscar-produtos', checkPermision('adm'), async (req, res) => {
        try {
            const { query, sort, page = 1, limit = 10 } = req.query;

            const queryString = typeof query === 'string' ? query : null;

            let searchCriterio = {};
            if (queryString) {
                const regex = createAccentInsensitiveRegex(queryString);

                searchCriterio = {
                    $or: [
                        { nome: { $regex: regex } },
                        { descricao: { $regex: regex } },
                        { marca: { $regex: regex } },
                        { categoria: { $regex: regex } },
                        { especificacoes: { $regex: regex } },
                        { status: { $regex: regex } }
                    ],
                };
            }

            let sortOption = {};
            if (sort) {
                const sortOrder = sort.startsWith('-') ? -1 : 1;
                const sortField = sort.replace('-', '');

                if (sortField === 'nome') {
                    sortOption = { nome: sortOrder };
                } else if (sortField === 'valor') {
                    sortOption = { preco: sortOrder };
                } else {
                    sortOption = { [sortField]: sortOrder };
                }
            }

            const currentPage = parseInt(page, 10) || 1;
            const itemsPerPage = parseInt(limit, 10) || 10;

            const totalItems = await Product.countDocuments(searchCriterio);

            const totalPages = Math.ceil(totalItems / itemsPerPage);

            const produtos = await Product.find(searchCriterio)
                .collation({ locale: "pt", strength: 2 })
                .sort(sortOption)
                .skip((currentPage - 1) * itemsPerPage)
                .limit(itemsPerPage)
                .lean();

            if (!produtos || produtos.length === 0) {
                return res.status(404).json({ msg: 'Nenhum produto encontrado!' });
            }

            res.status(200).json({
                produtos,
                totalItems,
                totalPages,
                currentPage,
            });
        } catch (error) {
            console.error('Erro ao realizar a busca de produtos:', error);
            res.status(500).json({ msg: 'Erro no servidor' });
        }
    });

    app.put('/adicionar-estoque', checkPermision('adm'), async (req, res) => {
        try {
            const resultado = await Product.updateMany({}, { $inc: { estoque: 1 } });

            res.status(200).json({
                msg: 'Estoque incrementado com sucesso!',
                atualizado: resultado.nModified,
                totalAfetado: resultado.matchedCount,
            });
        } catch (error) {
            res.status(500).json({
                msg: 'Erro ao atualizar estoque.',
                erro: error.message,
            });
        }
    });

    app.patch('/desativar-produto', checkPermision('adm'), async (req, res) => {
        try {
            const { id } = req.body

            const produto = await Product.findById(id);

            if (!produto) {
                return res.status(404).json({ msg: "Produto não encontrado!" });
            }

            if (produto.status === 'ativo') {
                produto.status = 'inativo';
            } else {
                produto.status = 'ativo';
            }

            await produto.save();

            res.status(200).json({ msg: 'Status do produto atualizado com sucesso' });
        } catch (error) {
            res.status(500).json({
                msg: 'Erro ao atualizar estoque.',
                erro: error.message,
            });
        }
    });

    app.get("/listar-produtos-por-estoque", checkPermision('adm'), async (req, res) => {
        try {
            const { estoque } = req.query;

            const produtos = await Product.find({
                estoque: { $lt: Number(estoque) },
            })
                .select('_id nome precoPrazo preco categoria marca images estoque status')
                .slice('images', 1)
                .lean();

            if (produtos.length === 0) {
                return res.status(404).json({ msg: "Nenhum produto encontrado!" });
            }

            res.status(200).json({ produtos });
        } catch (error) {
            console.error("Erro ao listar produtos:", error);
            res.status(500).json({ msg: "Erro no servidor!" });
        }
    });
}

module.exports = { productController };
