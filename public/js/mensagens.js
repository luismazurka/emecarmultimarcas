document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('messages-table-body');
    const searchBox = document.getElementById('search-box');
    const filters = document.querySelectorAll('.filtro-tipo, .filtro-status');
    let allMessages = [];
    let messageIdToDelete = null; // VARIÁVEL PARA GUARDAR O ID DA MENSAGEM A SER REMOVIDA

    // Modal de visualização
    const modalView = document.getElementById('modal-mensagem');
    const modalName = document.getElementById('view-message-name');
    const modalDate = document.getElementById('view-message-date');
    const modalDetails = document.getElementById('view-message-details');

    // NOVOS ELEMENTOS DO MODAL DE CONFIRMAÇÃO
    const modalConfirm = document.getElementById('modal-confirmacao-remocao');
    const confirmDeleteName = document.getElementById('confirm-delete-name');
    const btnConfirmarRemocao = document.getElementById('btn-confirmar-remocao');

    // Funções para abrir/fechar modais
    const openModal = (modal) => modal.classList.remove('hidden');
    const closeModal = (modal) => modal.classList.add('hidden');

    // =========================================================================
    // NOVA FUNÇÃO PARA EXIBIR NOTIFICAÇÕES (reutilizada)
    // =========================================================================
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);
        setTimeout(() => { notification.classList.add('show'); }, 10);
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    }

    const fetchMessages = async () => {
        try {
            const response = await fetch('/api/mensagens');
            if (!response.ok) throw new Error('Falha ao carregar mensagens.');
            allMessages = await response.json();
            renderMessages();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const renderMessages = () => {
        const searchTerm = searchBox.value.toLowerCase();
        const selectedTypes = Array.from(document.querySelectorAll('.filtro-tipo:checked')).map(cb => cb.value);
        const selectedStatus = Array.from(document.querySelectorAll('.filtro-status:checked')).map(cb => cb.value);

        const filteredMessages = allMessages.filter(msg => {
            const isTypeMatch = selectedTypes.length === 0 || selectedTypes.includes(msg.origin);
            const isStatusMatch = selectedStatus.length === 0 || 
                (selectedStatus.includes('lidas') && msg.read) ||
                (selectedStatus.includes('nao-lidas') && !msg.read);
            const isSearchMatch = !searchTerm || Object.values(msg).some(val => 
                String(val).toLowerCase().includes(searchTerm)
            );
            return isTypeMatch && isStatusMatch && isSearchMatch;
        });

        tableBody.innerHTML = filteredMessages.map(msg => `
            <tr data-id="${msg.id}" style="font-weight: ${msg.read ? 'normal' : 'bold'};">
                <td>${msg.name}</td>
                <td>${msg.origin}</td>
                <td>${new Date(msg.created_at).toLocaleDateString('pt-BR')}</td>
                <td class="action-buttons">
                    <button class="btn-action btn-view" title="Visualizar"><i class="fas fa-eye"></i></button>
                    <button class="btn-action btn-toggle-read" title="${msg.read ? 'Marcar como não lida' : 'Marcar como lida'}">
                        <i class="fas ${msg.read ? 'fa-envelope' : 'fa-envelope-open'}"></i>
                    </button>
                    <button class="btn-action btn-delete" title="Remover"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `).join('');
    };

    const viewMessage = (msg) => {
        modalName.textContent = msg.name;
        modalDate.textContent = new Date(msg.created_at).toLocaleString('pt-BR');
        let detailsHtml = `<p><strong>Email:</strong> ${msg.email || 'N/A'}</p><p><strong>Telefone:</strong> ${msg.phone || 'N/A'}</p>`;
        
        if (msg.details) {
            for (const [key, value] of Object.entries(msg.details)) {
                detailsHtml += `<p><strong>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${value}</p>`;
            }
        }
        detailsHtml += `<hr style="border-color: #eee; margin: 1rem 0;"><p><strong>Mensagem:</strong><br>${msg.message || 'Nenhuma mensagem.'}</p>`;
        
        modalDetails.innerHTML = detailsHtml;
        openModal(modalView);
    };

    // Event Listener da Tabela
    tableBody.addEventListener('click', async (e) => {
        const button = e.target.closest('.btn-action');
        if (!button) return;

        const row = button.closest('tr');
        const id = row.dataset.id;
        const msg = allMessages.find(m => m.id == id);

        if (button.classList.contains('btn-view')) {
            if (!msg.read) {
                await fetch(`/api/mensagens/${id}/read`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ read: true }) });
                fetchMessages(); // Recarrega para atualizar o status visual antes de abrir
            }
            viewMessage(msg);
        } else if (button.classList.contains('btn-toggle-read')) {
            await fetch(`/api/mensagens/${id}/read`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ read: !msg.read }) });
            fetchMessages();
        } else if (button.classList.contains('btn-delete')) {
            // ALTERADO: Lógica do botão de remover
            messageIdToDelete = id; // Guarda o ID
            confirmDeleteName.textContent = msg.name; // Coloca o nome no modal
            openModal(modalConfirm); // Abre o modal de confirmação
        }
    });

    // NOVO: Event listener para o botão de confirmar a remoção
    btnConfirmarRemocao.addEventListener('click', async () => {
        if (!messageIdToDelete) return;

        try {
            const response = await fetch(`/api/mensagens/${messageIdToDelete}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Falha ao remover a mensagem.');
            
            showNotification('Mensagem removida com sucesso!', 'success');
            fetchMessages(); // Atualiza a tabela
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            closeModal(modalConfirm); // Fecha o modal de confirmação
            messageIdToDelete = null; // Limpa o ID
        }
    });

    // Eventos para filtros e fechar modais
    searchBox.addEventListener('input', renderMessages);
    filters.forEach(cb => cb.addEventListener('change', renderMessages));
    
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal-overlay'));
        });
    });
    
    // Fecha o modal ao clicar fora dele
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
    });

    fetchMessages(); // Carga inicial
});