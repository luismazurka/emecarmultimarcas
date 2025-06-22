// =========================================================================
// 1. IMPORTAÇÕES E CONFIGURAÇÃO INICIAL
// =========================================================================
const express = require('express');
const path = require('path');
const hbs = require('hbs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const multer = require('multer');
const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

const app = express();
const port = 3000;

// =========================================================================
// 2. CONFIGURAÇÃO DO MULTER (PARA UPLOAD DE FICHEIROS)
// =========================================================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middlewares específicos para cada tipo de upload
const personDocumentUpload = upload.fields([
    { name: 'cnh', maxCount: 1 },
    { name: 'comprovante_residencia', maxCount: 1 },
    { name: 'comprovante_renda', maxCount: 1 }
]);
const vehiclePhotoUpload = upload.array('fotos', 10);


// =========================================================================
// 3. MIDDLEWARES DO EXPRESS
// =========================================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    store: new SQLiteStore({ db: 'dev.sqlite3', dir: './', table: 'sessions' }),
    secret: 'mude-para-uma-frase-muito-segura-e-aleatoria',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 horas
  })
);

const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// =========================================================================
// 4. CONFIGURAÇÃO DO TEMPLATE ENGINE (HBS)
// =========================================================================
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src/views'));
// Helper para o Handlebars comparar valores
hbs.registerHelper('eq', function (a, b) {
    return a === b;
});
// No topo do server.js
hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

// =========================================================================
// 5. ROTAS PÚBLICAS (NÃO PRECISAM DE LOGIN)
// =========================================================================

/* ROTA PARA A PÁGINA INICIAL PÚBLICA */
app.get('/', async (req, res, next) => {
    try {
        // 1. Busca os veículos do banco de dados
        const destaquesDb = await knex('vehicles')
            .where({ 'destaque_site': true, 'exibir_site': true })
            .orderBy('created_at', 'desc')
            .limit(8);

        const recentesDb = await knex('vehicles')
            .where('exibir_site', true)
            .orderBy('created_at', 'desc')
            .limit(8);

        // 2. Função para converter a string JSON de fotos em um array real
        const parseVeiculos = (veiculos) => {
            return veiculos.map(vehicle => {
                let fotosArray = [];
                // Verifica se o campo existe e é uma string antes de tentar converter
                if (vehicle.fotos_paths && typeof vehicle.fotos_paths === 'string') {
                    try {
                        // Converte a string '["foto1.jpg"]' para um array ["foto1.jpg"]
                        fotosArray = JSON.parse(vehicle.fotos_paths);
                    } catch (e) {
                        console.error(`Erro ao converter JSON para o veículo ID ${vehicle.id}:`, e);
                        // Em caso de erro, continua com um array vazio para não quebrar a página
                        fotosArray = [];
                    }
                } else if (Array.isArray(vehicle.fotos_paths)) {
                    // Se já for um array, apenas usa
                    fotosArray = vehicle.fotos_paths;
                }
                
                // Retorna o objeto do veículo com a propriedade fotos_paths corrigida
                return {
                    ...vehicle,
                    fotos_paths: fotosArray
                };
            });
        };

        // 3. Aplica a correção nos dados
        const destaques = parseVeiculos(destaquesDb);
        const recentes = parseVeiculos(recentesDb);

        // 4. Renderiza a página com os dados prontos para o template
        res.render('home', {
            title: 'Seu Próximo Carro Está Aqui',
            layout: 'public_layout',
            destaques,
            recentes
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});


app.get('/login', (req, res) => { res.render('login', { layout: false }); });

app.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await knex('users').where({ name: name }).first();
        if (!user) {
            return res.render('login', { layout: false, error: 'Utilizador ou senha inválidos.' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (passwordMatch) {
            req.session.userId = user.id;
            req.session.userName = user.name;
            // CORREÇÃO AQUI: Redireciona para o painel após o login
            res.redirect('/painel'); 
        } else {
            return res.render('login', { layout: false, error: 'Utilizador ou senha inválidos.' });
        }
    } catch (error) {
        console.error(error);
        return res.render('login', { layout: false, error: 'Ocorreu um erro no servidor.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/painel');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

app.get('/quem-somos', (req, res) => {
  res.render('quem-somos', { 
    title: 'Quem Somos',
    layout: 'public_layout' 
  });
});

// Em server.js, na seção de ROTAS PÚBLICAS

app.get('/fale-conosco', (req, res) => {
  res.render('fale-conosco', { 
    title: 'Fale Conosco',
    layout: 'public_layout' 
  });
});

// Em server.js

// Em server.js, substitua a rota GET /veiculos existente por esta

app.get('/veiculos', async (req, res, next) => {
    try {
        // --- LÓGICA DE ORDENAÇÃO ---
        const sortBy = req.query.sort || 'recentes'; // Pega o valor da URL, ou usa 'recentes' como padrão
        let orderByColumn = 'created_at';
        let orderDirection = 'desc';

        switch (sortBy) {
            case 'preco-menor':
                orderByColumn = 'valor_venda';
                orderDirection = 'asc';
                break;
            case 'preco-maior':
                orderByColumn = 'valor_venda';
                orderDirection = 'desc';
                break;
            // O caso 'recentes' já é o padrão
        }

        // Busca os veículos no banco JÁ COM A ORDEM CORRETA
        const veiculosDb = await knex('vehicles')
            .where('exibir_site', true)
            .orderBy(orderByColumn, orderDirection); // Usa as variáveis de ordenação
            //.debug(true); // <--- ADICIONE ESTA LINHA PARA DEPURAR

        // (A função parseVeiculos continua a mesma)
        const parseVeiculos = (veiculos) => {
            return veiculos.map(vehicle => {
                let fotosArray = [];
                if (vehicle.fotos_paths && typeof vehicle.fotos_paths === 'string') {
                    try {
                        fotosArray = JSON.parse(vehicle.fotos_paths);
                    } catch (e) { fotosArray = []; }
                } else if (Array.isArray(vehicle.fotos_paths)) {
                    fotosArray = vehicle.fotos_paths;
                }
                return { ...vehicle, fotos_paths: fotosArray };
            });
        };

        const veiculos = parseVeiculos(veiculosDb);
        
        res.render('public/veiculos', {
            title: 'Nosso Estoque',
            layout: 'public_layout',
            veiculos,
            sortBy: sortBy // Envia a opção de ordenação de volta para a view
        });

    } catch (error) {
        console.error('Erro ao buscar veículos:', error);
        next(error);
    }
});

// Em server.js, na seção de ROTAS PÚBLICAS

app.get('/veiculo/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const veiculo = await knex('vehicles').where({ id: id }).first();

        if (!veiculo || !veiculo.exibir_site) {
            // Se não encontrar o veículo ou ele não estiver marcado para exibir, mostra erro 404
            return res.status(404).render('public/404', { title: 'Não Encontrado', layout: 'public_layout' });
        }

        // Converte os campos JSON de texto para arrays
        veiculo.fotos_paths = veiculo.fotos_paths ? JSON.parse(veiculo.fotos_paths) : [];
        veiculo.opcionais = veiculo.opcionais ? JSON.parse(veiculo.opcionais) : [];

        // Limpa os caminhos das fotos com barras invertidas (para dados antigos)
        if (veiculo.fotos_paths.length > 0) {
            veiculo.fotos_paths = veiculo.fotos_paths.map(path => path.split(/[\\\/]/).pop());
        }

        res.render('public/veiculo', {
            title: `${veiculo.marca} ${veiculo.modelo}`,
            layout: 'public_layout',
            veiculo
        });
        
    } catch (error) {
        console.error('Erro ao buscar detalhes do veículo:', error);
        next(error);
    }
});

// =========================================================================
// 6. ROTAS PROTEGIDAS - RENDERIZAÇÃO DE PÁGINAS
// =========================================================================

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/');
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});



app.get('/painel', requireLogin, async (req, res) => {
    try {
        const vehicles = await knex('vehicles').select('*').orderBy('id', 'desc');
        const statuses = ['preparacao', 'manutencao', 'estoque', 'testdrive', 'reserva', 'vendido'];
        const groupedVehicles = {};
        statuses.forEach(status => {
            groupedVehicles[status] = vehicles.filter(v => v.status === status);
        });
        res.render('painel', {
            pageTitle: 'Painel de Veículos',
            userName: req.session.userName,
            isPainelPage: true,
            statuses: statuses,
            vehiclesByStatus: groupedVehicles
        });
    } catch (error) {
        console.error("Erro ao carregar o painel:", error);
        res.status(500).send("Erro ao carregar o painel.");
    }
});

app.get('/usuarios', requireLogin, async (req, res) => {
    try {
        const usersFromDB = await knex('users').select('id', 'name', 'role');
        const formattedUsers = usersFromDB.map(user => ({ ...user, role_class: user.role.toLowerCase() }));
        res.render('usuarios', {
            pageTitle: 'Utilizadores',
            userName: req.session.userName,
            isUserPage: true,
            users: formattedUsers
        });
    } catch (error) {
        console.error("Erro ao procurar utilizadores:", error);
        res.status(500).send("Erro ao carregar a página de utilizadores.");
    }
});

app.get('/pessoas', requireLogin, async (req, res) => {
    try {
        const people = await knex('people').select('id', 'name', 'cpf', 'city', 'cell_phone').orderBy('name');
        res.render('pessoas', {
            pageTitle: 'Pessoas',
            userName: req.session.userName,
            isPessoasPage: true,
            people: people
        });
    } catch (error) {
        console.error("Erro ao procurar pessoas:", error);
        res.status(500).send("Erro ao carregar a página de pessoas.");
    }
});

app.get('/admin/veiculos', requireLogin, async (req, res) => {
    try {
        const vehicles = await knex('vehicles').select('*').orderBy('marca', 'modelo');
        res.render('admin/veiculos', {
            pageTitle: 'Veículos',
            userName: req.session.userName,
            isVeiculosPage: true,
            vehicles: vehicles
        });
    } catch (error) {
        console.error("Erro ao procurar veículos:", error);
        res.status(500).send("Erro ao carregar a página de veículos.");
    }
});

// Rota para RENDERIZAR a página de Indicadores
// **INÍCIO DA CORREÇÃO**
// Rota para RENDERIZAR a página de Indicadores
app.get('/indicadores', requireLogin, async (req, res) => {
    try {
        const vehicles = await knex('vehicles').select('status', 'created_at', 'marca', 'modelo');
        const today = new Date();
        
        vehicles.forEach(v => {
            const entryDate = new Date(v.created_at);
            v.dias = Math.ceil((today - entryDate) / (1000 * 60 * 60 * 24));
        });

        // 1. KPIs Principais
        const totalVeiculos = vehicles.length;
        const veiculosEstoque = vehicles.filter(v => v.status === 'estoque');
        const totalDiasEstoque = veiculosEstoque.reduce((sum, v) => sum + v.dias, 0);
        const tempoMedioEstoque = veiculosEstoque.length > 0 ? Math.round(totalDiasEstoque / veiculosEstoque.length) : 'N/A';
        const maiorPermanencia = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.dias)) : 'N/A';

        // 2. Agrupamento por Status com Percentagem
        const statusList = ['preparacao', 'manutencao', 'estoque', 'testdrive', 'reserva', 'vendido'];
        const groupedByStatus = statusList.reduce((acc, status) => {
            acc[status] = vehicles.filter(v => v.status === status).length;
            return acc;
        }, {});
        const distribuicao = Object.entries(groupedByStatus).map(([label, count]) => ({
            label,
            count,
            percentage: totalVeiculos > 0 ? ((count / totalVeiculos) * 100).toFixed(1) : 0
        }));

        // 3. Tempo Médio por Etapa com Percentagem
        const tempoMedioPorEtapa = {};
        statusList.forEach(status => {
            const veiculosNoStatus = vehicles.filter(v => v.status === status);
            const totalDias = veiculosNoStatus.reduce((sum, v) => sum + v.dias, 0);
            tempoMedioPorEtapa[status] = veiculosNoStatus.length > 0 ? Math.round(totalDias / veiculosNoStatus.length) : 0;
        });
        const maxTempoMedio = Math.max(...Object.values(tempoMedioPorEtapa));
        const tempoMedio = Object.entries(tempoMedioPorEtapa).map(([label, dias]) => ({
            label,
            dias: dias || 'N/A',
            percentage: maxTempoMedio > 0 ? ((dias / maxTempoMedio) * 100) : 0
        }));
        
        // 4. Veículos com Longa Permanência
        const longaPermanencia = [...vehicles].sort((a, b) => b.dias - a.dias).slice(0, 5);
        
        const indicators = {
            kpis: { totalVeiculos, tempoMedioEstoque, maiorPermanencia },
            distribuicao: distribuicao,
            tempoMedio: tempoMedio,
            longaPermanencia: longaPermanencia,
            mensal: { labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'], entradas: [8, 12, 9, 14, 'N/A'], saidas: [5, 9, 7, 10, 'N/A'] }
        };

        res.render('indicadores', {
            pageTitle: 'Indicadores',
            userName: req.session.userName,
            isIndicadoresPage: true,
            indicators: indicators
        });
    } catch (error) {
        console.error("Erro ao carregar indicadores:", error);
        res.status(500).send("Erro ao carregar a página de indicadores.");
    }
});
// **FIM DA CORREÇÃO**

// Adicionar na Secção 6 - ROTAS PROTEGIDAS
app.get('/mensagens', requireLogin, async (req, res) => {
    try {
        const messages = await knex('messages').select('*').orderBy('created_at', 'desc');
        res.render('mensagens', {
            pageTitle: 'Mensagens',
            userName: req.session.userName,
            isMensagensPage: true,
            messages: messages
        });
    } catch (error) {
        console.error("Erro ao procurar mensagens:", error);
        res.status(500).send("Erro ao carregar a página de mensagens.");
    }
});

// =========================================================================
// 7. ROTAS DA API REST (PROTEGIDAS)
// =========================================================================

// --- API para Utilizadores ---
app.get('/api/usuarios/:id', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await knex('users').where({ id }).select('id', 'name', 'role', 'created_at').first();
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'Utilizador não encontrado' });
        }
    } catch (error) {
        console.error('Erro ao procurar utilizador:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno.' });
    }
});
app.post('/api/usuarios', requireLogin, async (req, res) => {
    try {
        const { name, role, password } = req.body;
        if (!name || !role || !password) {
            return res.status(400).json({ error: 'Nome, perfil e senha são obrigatórios.' });
        }
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        const [newUserId] = await knex('users').insert({ name, role, password_hash });
        const newUser = { id: newUserId, name, role };
        res.status(201).json({ message: 'Utilizador registado com sucesso!', user: newUser });
    } catch (error) {
        console.error('Erro ao registar utilizador:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno.' });
    }
});
app.put('/api/usuarios/:id', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, password } = req.body;
        const updatedData = { name, role };
        if (password) {
            const saltRounds = 10;
            updatedData.password_hash = await bcrypt.hash(password, saltRounds);
        }
        const updatedCount = await knex('users').where({ id }).update(updatedData);
        if (updatedCount > 0) {
            res.json({ message: `Utilizador ${id} atualizado com sucesso!` });
        } else {
            res.status(404).json({ error: 'Utilizador não encontrado para atualização.' });
        }
    } catch (error) {
        console.error('Erro ao editar utilizador:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno.' });
    }
});
app.delete('/api/usuarios/:id', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCount = await knex('users').where({ id }).del();
        if (deletedCount > 0) {
            res.json({ message: `Utilizador ${id} removido com sucesso!` });
        } else {
            res.status(404).json({ error: 'Utilizador não encontrado para remoção.' });
        }
    } catch (error) {
        console.error('Erro ao remover utilizador:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno.' });
    }
});


// --- API para Pessoas ---
app.get('/api/pessoas/:id', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const person = await knex('people').where({ id }).first();
        if (person) {
            if (person.personal_references) {
                person.personal_references = JSON.parse(person.personal_references);
            }
            res.json(person);
        } else {
            res.status(404).json({ error: 'Pessoa não encontrada.' });
        }
    } catch (error) {
        console.error('Erro ao procurar pessoa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
app.post('/api/pessoas', requireLogin, personDocumentUpload, async (req, res) => {
    try {
        const personData = req.body;
        for (const key in personData) { if (personData[key] === '') { personData[key] = null; } }
        if (req.files['cnh']) { personData.cnh_path = req.files['cnh'][0].path; }
        if (req.files['comprovante_residencia']) { personData.residence_proof_path = req.files['comprovante_residencia'][0].path; }
        if (req.files['comprovante_renda']) { personData.income_proof_path = req.files['comprovante_renda'][0].path; }
        personData.personal_references = JSON.stringify([{ name: personData.ref_nome1, phone: personData.ref_telefone1 },{ name: personData.ref_nome2, phone: personData.ref_telefone2 }]);
        delete personData.ref_nome1;
        delete personData.ref_telefone1;
        delete personData.ref_nome2;
        delete personData.ref_telefone2;
        const [newPersonId] = await knex('people').insert(personData);
        res.status(201).json({ message: 'Pessoa registada com sucesso!', id: newPersonId });
    } catch (error) {
        console.error('Erro ao registar pessoa:', error);
        if (error.code === 'SQLITE_CONSTRAINT') { return res.status(400).json({ error: `Falha ao registar: O valor para o campo ${error.message.split(': ')[2]} já existe.` }); }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
app.put('/api/pessoas/:id', requireLogin, personDocumentUpload, async (req, res) => {
    try {
        const { id } = req.params;
        const personData = req.body;
        for (const key in personData) { if (personData[key] === '') { personData[key] = null; } }
        if (req.files['cnh']) { personData.cnh_path = req.files['cnh'][0].path; }
        if (req.files['comprovante_residencia']) { personData.residence_proof_path = req.files['comprovante_residencia'][0].path; }
        if (req.files['comprovante_renda']) { personData.income_proof_path = req.files['comprovante_renda'][0].path; }
        personData.personal_references = JSON.stringify([{ name: personData.ref_nome1, phone: personData.ref_telefone1 }, { name: personData.ref_nome2, phone: personData.ref_telefone2 }]);
        delete personData.ref_nome1;
        delete personData.ref_telefone1;
        delete personData.ref_nome2;
        delete personData.ref_telefone2;
        const updatedCount = await knex('people').where({ id }).update(personData);
        if (updatedCount > 0) {
            res.json({ message: 'Registo atualizado com sucesso!' });
        } else {
            res.status(404).json({ error: 'Pessoa não encontrada para atualização.' });
        }
    } catch (error) {
        console.error('Erro ao editar pessoa:', error);
        if (error.code === 'SQLITE_CONSTRAINT') { return res.status(400).json({ error: `Falha ao atualizar: O valor para o campo ${error.message.split(': ')[2]} já existe.` });}
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
app.delete('/api/pessoas/:id', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCount = await knex('people').where({ id }).del();
        if (deletedCount > 0) {
            res.json({ message: 'Pessoa removida com sucesso!' });
        } else {
            res.status(404).json({ error: 'Pessoa não encontrada para remoção.' });
        }
    } catch (error) {
        console.error('Erro ao remover pessoa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


// --- API para Veículos ---
app.get('/api/veiculos/:id', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await knex('vehicles').where({ id }).first();
        if (vehicle) {
            if (vehicle.opcionais) vehicle.opcionais = JSON.parse(vehicle.opcionais);
            if (vehicle.fotos_paths) vehicle.fotos_paths = JSON.parse(vehicle.fotos_paths);
            res.json(vehicle);
        } else {
            res.status(404).json({ error: 'Veículo não encontrado.' });
        }
    } catch (error) {
        console.error('Erro ao procurar veículo:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});
// No seu server.js
app.post('/api/veiculos', requireLogin, vehiclePhotoUpload, async (req, res) => {
    try {
        const vehicleData = req.body;

        // Limpa campos vazios
        for (const key in vehicleData) { if (vehicleData[key] === '') { vehicleData[key] = null; } }

        // --- CORREÇÃO 1: Trata os checkboxes ---
        // Converte o valor "on" do formulário para true, e a ausência para false.
        vehicleData.exibir_site = vehicleData.exibir_site === 'on';
        vehicleData.destaque_site = vehicleData.destaque_site === 'on';

        // Converte os opcionais para JSON
        vehicleData.opcionais = JSON.stringify(vehicleData.opcionais || []);

        // --- CORREÇÃO 2: Trata as fotos ---
        // Verifica se foram enviados arquivos (req.files)
        if (req.files && req.files.length > 0) {
            // Salva apenas os NOMES dos arquivos (file.filename) em vez do caminho completo (file.path)
            vehicleData.fotos_paths = JSON.stringify(req.files.map(file => file.filename));
        } else {
            // Se nenhuma foto nova for enviada, garante que o campo não seja enviado como indefinido
            delete vehicleData.fotos_paths;
        }

        const [newVehicleId] = await knex('vehicles').insert(vehicleData);
        res.status(201).json({ message: 'Veículo registrado com sucesso!', id: newVehicleId });
    } catch (error) {
        console.error('Erro ao registrar veículo:', error);
        res.status(500).json({ error: 'Erro interno ao registrar veículo.' });
    }
});
// No seu server.js
app.put('/api/veiculos/:id', requireLogin, vehiclePhotoUpload, async (req, res) => {
    try {
        const { id } = req.params;
        const vehicleData = req.body;

        // Limpa campos vazios
        for (const key in vehicleData) { if (vehicleData[key] === '') { vehicleData[key] = null; } }

        // --- CORREÇÃO 1: Trata os checkboxes ---
        vehicleData.exibir_site = vehicleData.exibir_site === 'on';
        vehicleData.destaque_site = vehicleData.destaque_site === 'on';

        // Converte os opcionais para JSON
        vehicleData.opcionais = JSON.stringify(vehicleData.opcionais || []);

        // --- CORREÇÃO 2: Trata as fotos ---
        if (req.files && req.files.length > 0) {
            // Salva apenas os NOMES dos arquivos (file.filename)
            vehicleData.fotos_paths = JSON.stringify(req.files.map(file => file.filename));
        } else {
            // Se nenhuma foto nova for enviada, não altera as fotos existentes
            delete vehicleData.fotos_paths; 
        }

        const updatedCount = await knex('vehicles').where({ id }).update(vehicleData);

        if (updatedCount > 0) {
            res.json({ message: 'Veículo atualizado com sucesso!' });
        } else {
            res.status(404).json({ error: 'Veículo não encontrado para atualização.' });
        }
    } catch (error) {
        console.error('Erro ao editar veículo:', error);
        res.status(500).json({ error: 'Erro interno ao editar veículo.' });
    }
});
app.delete('/api/veiculos/:id', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCount = await knex('vehicles').where({ id }).del();
        if (deletedCount > 0) {
            res.json({ message: 'Veículo removido com sucesso!' });
        } else {
            res.status(404).json({ error: 'Veículo não encontrado para remoção.' });
        }
    } catch (error) {
        console.error('Erro ao remover veículo:', error);
        res.status(500).json({ error: 'Erro interno ao remover veículo.' });
    }
});
app.put('/api/veiculos/:id/status', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'O novo status é obrigatório.' });
        const updatedCount = await knex('vehicles').where({ id }).update({ status: status });
        if (updatedCount > 0) {
            res.json({ message: 'Status atualizado com sucesso!' });
        } else {
            res.status(404).json({ error: 'Veículo não encontrado.' });
        }
    } catch (error) {
        console.error('Erro ao atualizar status do veículo:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Adicionar na Secção 7 - ROTAS DA API REST
// --- API para Mensagens ---
app.get('/api/mensagens', requireLogin, async (req, res) => {
    try {
        const messages = await knex('messages').select('*').orderBy('created_at', 'desc');
        // Converte o campo de detalhes de JSON para objeto
        messages.forEach(msg => {
            if (msg.details) msg.details = JSON.parse(msg.details);
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao procurar mensagens.' });
    }
});

app.put('/api/mensagens/:id/read', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const { read } = req.body;
        const updatedCount = await knex('messages').where({ id }).update({ read: read });
        if (updatedCount > 0) {
            res.json({ message: 'Status da mensagem atualizado.' });
        } else {
            res.status(404).json({ error: 'Mensagem não encontrada.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar status da mensagem.' });
    }
});

app.delete('/api/mensagens/:id', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCount = await knex('messages').where({ id }).del();
        if (deletedCount > 0) {
            res.json({ message: 'Mensagem removida com sucesso.' });
        } else {
            res.status(404).json({ error: 'Mensagem não encontrada.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover mensagem.' });
    }
});

// Em server.js, junto com as outras rotas de API

app.post('/api/mensagens/contato', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validação simples
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Nome, e-mail e mensagem são obrigatórios.' });
        }

        const novaMensagem = {
            name,
            email,
            phone,
            message,
            origin: 'contato', // Define a origem para o filtro funcionar no painel
            read: false
        };

        await knex('messages').insert(novaMensagem);

        res.status(201).json({ message: 'Mensagem recebida com sucesso!' });

    } catch (error) {
        console.error('Erro ao salvar mensagem de contato:', error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});

// =========================================================================
// 8. INICIAR O SERVIDOR
// =========================================================================
app.listen(port, () => {
    console.log(`Servidor a correr na porta ${port}. Aceda a http://localhost:${port}`);
});
