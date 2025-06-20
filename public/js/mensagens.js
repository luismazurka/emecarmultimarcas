document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('messages-table-body');
    const searchBox = document.getElementById('search-box');
    const filters = document.querySelectorAll('.filtro-tipo, .filtro-status');
    let allMessages = [];

    // Modal elements
    const modal = document.getElementById('modal-mensagem');
    const modalName = document.getElementById('view-message-name');
    const modalDate = document.getElementById('view-message-date');
    const modalDetails = document.getElementById('view-message-details');

    const openModal = () => modal.classList.remove('hidden');
    const closeModal = () => modal.classList.add('hidden');

    const fetchMessages = async () => {
        try {
            const response = await fetch('/api/mensagens');
            if (!response.ok) throw new Error('Falha ao carregar mensagens.');
            allMessages = await response.json();
            renderMessages();
        } catch (error) {
            alert(error.message);
        }
    };

    const renderMessages = () => {
        const searchTerm = searchBox.value.toLowerCase();
        const selectedTypes = Array.from(document.querySelectorAll('.filtro-tipo:checked')).map(cb => cb.value);
        const selectedStatus = Array.from(document.querySelectorAll('.filtro-status:checked')).map(cb => cb.value);

        const filteredMessages = allMessages.filter(msg => {
            const isTypeMatch = selectedTypes.includes(msg.origin);
            
            const isStatusMatch = 
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
                detailsHtml += `<p><strong>${key.replace('_', ' ')}:</strong> ${value}</p>`;
            }
        }
        detailsHtml += `<hr style="border-color: #eee; margin: 1rem 0;"><p><strong>Mensagem:</strong><br>${msg.message || 'Nenhuma mensagem.'}</p>`;
        
        modalDetails.innerHTML = detailsHtml;
        openModal();
    };

    // Event Listeners
    tableBody.addEventListener('click', async (e) => {
        const button = e.target.closest('.btn-action');
        if (!button) return;

        const row = button.closest('tr');
        const id = row.dataset.id;
        const msg = allMessages.find(m => m.id == id);

        if (button.classList.contains('btn-view')) {
            if (!msg.read) {
                await fetch(`/api/mensagens/${id}/read`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ read: true }) });
            }
            viewMessage(msg);
            fetchMessages(); // Recarrega para atualizar o status visual
        } else if (button.classList.contains('btn-toggle-read')) {
            await fetch(`/api/mensagens/${id}/read`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ read: !msg.read }) });
            fetchMessages();
        } else if (button.classList.contains('btn-delete')) {
            if (confirm(`Tem a certeza que deseja remover a mensagem de ${msg.name}?`)) {
                await fetch(`/api/mensagens/${id}`, { method: 'DELETE' });
                fetchMessages();
            }
        }
    });

    searchBox.addEventListener('input', renderMessages);
    filters.forEach(cb => cb.addEventListener('change', renderMessages));
    
    document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => closeModal()));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    fetchMessages(); // Carga inicial
});
