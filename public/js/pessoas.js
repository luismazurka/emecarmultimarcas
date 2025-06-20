document.addEventListener('DOMContentLoaded', function() {
    // Seleção de Elementos
    const tableBody = document.getElementById('people-table-body');
    const btnCadastrar = document.getElementById('btn-cadastrar-pessoa');
    const searchBox = document.getElementById('search-box');
    let currentPersonId = null;

    // Modais
    const modalPessoa = document.getElementById('modal-pessoa');
    const modalVisualizacao = document.getElementById('modal-visualizacao');
    const modalRemocao = document.getElementById('modal-remocao');

    // Elementos do Modal de Cadastro/Edição
    const pessoaForm = document.getElementById('pessoa-form');
    const modalPessoaTitle = document.getElementById('modal-pessoa-title');

    // Funções utilitárias para modais
    const openModal = (modal) => modal.classList.remove('hidden');
    const closeModal = (modal) => modal.classList.add('hidden');

    // Função para preencher o formulário no modo de edição
    const fillForm = (data) => {
        // Preenche campos simples
        for (const key in data) {
            const field = pessoaForm.querySelector(`[name="${key}"]`);
            if (field && field.type !== 'file') { // Ignora campos de ficheiro
                if (field.type === 'date' && data[key]) {
                    field.value = data[key].split('T')[0]; // Formata data
                } else {
                    field.value = data[key];
                }
            }
        }
        // Preenche referências
        if (data.personal_references && data.personal_references.length > 0) {
            pessoaForm.querySelector('[name="ref_nome1"]').value = data.personal_references[0]?.name || '';
            pessoaForm.querySelector('[name="ref_telefone1"]').value = data.personal_references[0]?.phone || '';
            pessoaForm.querySelector('[name="ref_nome2"]').value = data.personal_references[1]?.name || '';
            pessoaForm.querySelector('[name="ref_telefone2"]').value = data.personal_references[1]?.phone || '';
        }
    };

    // --- EVENT LISTENERS ---

    // Ações na Tabela (Visualizar, Editar, Remover) - Usando Event Delegation
    tableBody.addEventListener('click', async (event) => {
        const target = event.target.closest('.btn-action');
        if (!target) return;

        const row = target.closest('tr');
        currentPersonId = row.dataset.id;

        if (target.classList.contains('btn-view')) {
            const response = await fetch(`/api/pessoas/${currentPersonId}`);
            if(response.ok) {
                const data = await response.json();
                document.getElementById('view-person-name').textContent = data.name;
                // Mostra todos os dados, incluindo links para os documentos
                const detailsContent = document.getElementById('view-details-content');
                detailsContent.innerHTML = Object.entries(data).map(([key, value]) => {
                    if (value && typeof value !== 'object') {
                        // Se for um caminho de ficheiro, cria um link
                        if (key.includes('_path')) {
                           // Remove 'public\' ou 'public/' do caminho para criar um link válido
                           const cleanPath = value.replace(/\\/g, '/').replace('public/', '');
                           return `<p><strong>${key.replace('_path', '').replace('_', ' ').toUpperCase()}:</strong> <a href="/${cleanPath}" target="_blank" class="doc-link">Ver Documento</a></p>`;
                        }
                        return `<p><strong>${key.replace(/_/g, ' ').toUpperCase()}:</strong> ${value}</p>`;
                    }
                    return '';
                }).join('');
                openModal(modalVisualizacao);
            }
        } 
        else if (target.classList.contains('btn-edit')) {
            const response = await fetch(`/api/pessoas/${currentPersonId}`);
             if(response.ok) {
                const data = await response.json();
                modalPessoaTitle.textContent = 'Editar Cadastro';
                fillForm(data);
                openModal(modalPessoa);
             }
        } 
        else if (target.classList.contains('btn-delete')) {
            const personName = row.cells[0].textContent;
            document.getElementById('delete-person-name').textContent = personName;
            openModal(modalRemocao);
        }
    });

    // Abrir Modal para Novo Cadastro
    btnCadastrar.addEventListener('click', () => {
        currentPersonId = null;
        modalPessoaTitle.textContent = 'Cadastrar Nova Pessoa';
        pessoaForm.reset();
        openModal(modalPessoa);
    });

    // Submissão do Formulário (Salvar ou Editar) - AGORA COM UPLOAD
    pessoaForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Com ficheiros, usamos FormData diretamente.
        // O navegador tratará do 'Content-Type' (multipart/form-data).
        const formData = new FormData(pessoaForm);

        // Validação simples do nome
        if (!formData.get('name')) {
            alert('O campo "Nome Completo" é obrigatório.');
            return;
        }
        
        const url = currentPersonId ? `/api/pessoas/${currentPersonId}` : '/api/pessoas';
        const method = currentPersonId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                // NÃO definimos 'Content-Type', o navegador faz isso com FormData
                body: formData, 
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Falha ao guardar os dados.');
            }
            
            alert('Operação realizada com sucesso!');
            location.reload();

        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    });
    
    // Confirmação de Remoção
    document.getElementById('btn-confirmar-remocao').addEventListener('click', async () => {
        try {
            const response = await fetch(`/api/pessoas/${currentPersonId}`, { method: 'DELETE' });
            if (response.ok) {
                alert('Pessoa removida com sucesso!');
                location.reload();
            } else {
                 throw new Error('Falha ao remover.');
            }
        } catch(error) {
            alert(error.message);
        }
    });

    // Lógica para fechar todos os modais
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
    });
    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', () => closeModal(button.closest('.modal-overlay')));
    });

    // Lógica das Abas
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Filtro de Busca
    searchBox.addEventListener('keyup', () => {
        const searchTerm = searchBox.value.toLowerCase();
        tableBody.querySelectorAll('tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
        });
    });
});
