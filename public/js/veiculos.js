document.addEventListener('DOMContentLoaded', function() {
    // Seleção de Elementos Globais
    const tableBody = document.getElementById('vehicle-table-body');
    const btnCadastrar = document.getElementById('btn-cadastrar-veiculo');
    const searchBox = document.getElementById('search-box');
    let currentVehicleId = null;

    // Modais
    const modalVeiculo = document.getElementById('modal-veiculo');
    const modalVisualizacao = document.getElementById('modal-visualizacao-veiculo');
    const modalRemocao = document.getElementById('modal-remocao-veiculo');

    // Elementos do Formulário e Modais
    const veiculoForm = document.getElementById('veiculo-form');
    const modalVeiculoTitle = document.getElementById('modal-veiculo-title');
    const viewVehicleTitle = document.getElementById('view-vehicle-title');
    const viewVehicleContent = document.getElementById('view-vehicle-content');
    const deleteVehicleName = document.getElementById('delete-vehicle-name');
    const btnConfirmarRemocao = document.getElementById('btn-confirmar-remocao-veiculo');

    // Funções utilitárias para modais
    const openModal = (modal) => modal && modal.classList.remove('hidden');
    const closeModal = (modal) => modal && modal.classList.add('hidden');

    // Função para preencher o formulário no modo de edição
    const fillVehicleForm = (data) => {
        veiculoForm.reset();
        for (const key in data) {
            const field = veiculoForm.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = !!data[key];
                } else if (field.type === 'radio') {
                    const radioToCheck = veiculoForm.querySelector(`input[name="${key}"][value="${data[key]}"]`);
                    if (radioToCheck) radioToCheck.checked = true;
                } else if (field.type !== 'file') {
                    field.value = data[key] || '';
                }
            }
        }
        if (data.opcionais && Array.isArray(data.opcionais)) {
            data.opcionais.forEach(opt => {
                const checkbox = veiculoForm.querySelector(`input[name="opcionais"][value="${opt}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    };

    // Função para criar o HTML de visualização do veículo
    const createViewHtml = (data) => {
        let html = '<div class="view-details form-grid" style="gap: 0.5rem 1.5rem;">';
        const placeholder = '<span style="color: #999;">Não informado</span>';
        const createDetailItem = (label, value, colSpan = 'grid-col-2') => {
            return `<div class="${colSpan}" style="padding-bottom: 0.5rem; border-bottom: 1px solid #f0f0f0;">
                        <strong style="font-size: 0.8rem; color: #555; display: block;">${label}</strong>
                        <span>${value || placeholder}</span>
                    </div>`;
        };
        html += createDetailItem('Marca', data.marca);
        html += createDetailItem('Modelo', data.modelo);
        html += createDetailItem('Versão', data.versao, 'grid-col-4');
        html += createDetailItem('Ano Fabricação', data.ano_fab);
        html += createDetailItem('Ano Modelo', data.ano_modelo);
        html += createDetailItem('Matrícula', data.placa);
        html += createDetailItem('Quilometragem', data.km ? `${Number(data.km).toLocaleString('pt-BR')} km` : null);
        html += createDetailItem('Valor Venda', data.valor_venda ? `R$ ${parseFloat(data.valor_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null);
        html += '</div>';

        if (data.opcionais && Array.isArray(data.opcionais) && data.opcionais.length > 0) {
            html += `<h4 style="margin-top: 1rem;">Opcionais</h4><p style="line-height: 1.6;">${data.opcionais.join(', ')}</p>`;
        }

        // **INÍCIO DA CORREÇÃO**
        let fotos = data.fotos_paths;
        // Se for uma string (de um registo antigo), tenta fazer o parse.
        if (fotos && typeof fotos === 'string') {
            try { fotos = JSON.parse(fotos); } catch (e) { fotos = []; }
        }

        if (fotos && Array.isArray(fotos) && fotos.length > 0) {
            html += '<h4 style="margin-top: 1rem;">Fotos</h4><div class="galeria" style="margin-top: 0.5rem;">';
            fotos.forEach(path => {
                const cleanPath = path.replace(/\\/g, '/').replace('public/', '');
                html += `<a href="/${cleanPath}" target="_blank"><img src="/${cleanPath}" alt="Foto do veículo" style="width: 150px; height: auto; border-radius: 5px; margin: 5px;" /></a>`;
            });
            html += '</div>';
        }
        // **FIM DA CORREÇÃO**

        return html;
    };

    // --- LÓGICA DE EVENTOS ---
    btnCadastrar.addEventListener('click', () => {
        currentVehicleId = null;
        modalVeiculoTitle.textContent = 'Adicionar Novo Veículo';
        veiculoForm.reset();
        document.querySelector('.tab-link[data-tab="basico"]').click();
        openModal(modalVeiculo);
    });

    tableBody.addEventListener('click', async (event) => {
        const targetButton = event.target.closest('.btn-action');
        if (!targetButton) return;
        const row = targetButton.closest('tr');
        currentVehicleId = row.dataset.id;
        const vehicleName = row.cells[0].textContent.trim();
        if (targetButton.classList.contains('btn-view')) {
            const response = await fetch(`/api/veiculos/${currentVehicleId}`);
            if (response.ok) {
                const data = await response.json();
                viewVehicleTitle.textContent = `Detalhes de ${data.marca} ${data.modelo}`;
                viewVehicleContent.innerHTML = createViewHtml(data);
                openModal(modalVisualizacao);
            } else { alert('Erro ao carregar dados do veículo.'); }
        } 
        else if (targetButton.classList.contains('btn-edit')) {
            const response = await fetch(`/api/veiculos/${currentVehicleId}`);
            if (response.ok) {
                const data = await response.json();
                modalVeiculoTitle.textContent = 'Editar Veículo';
                fillVehicleForm(data);
                document.querySelector('.tab-link[data-tab="basico"]').click();
                openModal(modalVeiculo);
            } else { alert('Erro ao carregar dados do veículo.'); }
        } 
        else if (targetButton.classList.contains('btn-delete')) {
            deleteVehicleName.textContent = vehicleName;
            openModal(modalRemocao);
        }
    });

    veiculoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(veiculoForm);
        const url = currentVehicleId ? `/api/veiculos/${currentVehicleId}` : '/api/veiculos';
        const method = currentVehicleId ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, { method: method, body: formData });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Falha ao guardar os dados do veículo.');
            }
            alert('Operação realizada com sucesso!');
            location.reload();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    });

    btnConfirmarRemocao.addEventListener('click', async () => {
        try {
            const response = await fetch(`/api/veiculos/${currentVehicleId}`, { method: 'DELETE' });
            if (response.ok) {
                alert('Veículo removido com sucesso!');
                location.reload();
            } else { throw new Error('Falha ao remover.'); }
        } catch(error) {
            alert(error.message);
        }
    });

    // --- Lógica de UI Adicional ---
    document.querySelectorAll('[data-close-modal]').forEach(button => { button.addEventListener('click', () => closeModal(button.closest('.modal-overlay'))); });
    document.querySelectorAll('.modal-overlay').forEach(modal => { modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); }); });
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const activeContent = document.getElementById(tab.dataset.tab);
            if(activeContent) activeContent.classList.add('active');
        });
    });
    searchBox.addEventListener('keyup', () => {
        const searchTerm = searchBox.value.toLowerCase();
        tableBody.querySelectorAll('tr').forEach(row => { row.style.display = row.textContent.toLowerCase().includes(searchTerm) ? '' : 'none'; });
    });
});
