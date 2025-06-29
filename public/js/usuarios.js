document.addEventListener('DOMContentLoaded', function() {
    const userTableBody = document.querySelector('.user-table tbody');
    const btnCadastrar = document.getElementById('btn-cadastrar');

    // Modais
    const modalCadastroEdicao = document.getElementById('modal-cadastro-edicao');
    const modalVisualizacao = document.getElementById('modal-visualizacao');
    const modalRemocao = document.getElementById('modal-remocao');
    
    // Formulário e seus elementos
    const userForm = document.getElementById('user-form');
    const modalTitle = document.getElementById('modal-title');
    const passwordField = document.getElementById('user-password');
    const passwordLabel = passwordField.previousElementSibling;

    let currentUserId = null;

    // =========================================================================
    // NOVA FUNÇÃO PARA EXIBIR NOTIFICAÇÕES
    // =========================================================================
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`; // 'success' ou 'error'
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Força a transição a ser aplicada
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove a notificação após 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            // Espera a animação de saída terminar para remover o elemento
            notification.addEventListener('transitionend', () => {
                notification.remove();
            });
        }, 3000);
    }


    const openModal = (modal) => modal.classList.remove('hidden');
    const closeModal = (modal) => modal.classList.add('hidden');

    userTableBody.addEventListener('click', async (event) => {
        const target = event.target.closest('.btn-action');
        if (!target) return;

        const row = target.closest('tr');
        currentUserId = row.dataset.id;

        if (target.classList.contains('btn-view')) {
            const response = await fetch(`/api/usuarios/${currentUserId}`);
            const user = await response.json();
            document.getElementById('view-name').textContent = user.name;
            document.getElementById('view-role').textContent = user.role;
            // Assumindo que você já implementou a formatação da data no backend
            document.getElementById('view-date').textContent = user.created_at_formatted || new Date(user.created_at).toLocaleString('pt-BR');
            openModal(modalVisualizacao);
        } 
        else if (target.classList.contains('btn-edit')) {
            const response = await fetch(`/api/usuarios/${currentUserId}`);
            const user = await response.json();
            modalTitle.textContent = 'Editar Usuário';
            document.getElementById('user-name').value = user.name;
            document.getElementById('user-role').value = user.role.toLowerCase();
            passwordField.required = false;
            passwordLabel.textContent = 'Nova Senha (deixe em branco para não alterar)';
            openModal(modalCadastroEdicao);
        } 
        else if (target.classList.contains('btn-delete')) {
            const userName = row.querySelector('td').textContent;
            document.getElementById('delete-user-name').textContent = userName;
            openModal(modalRemocao);
        }
    });

    btnCadastrar.addEventListener('click', () => {
        currentUserId = null;
        modalTitle.textContent = 'Cadastrar Novo Usuário';
        userForm.reset();
        passwordField.required = true;
        passwordLabel.textContent = 'Senha';
        openModal(modalCadastroEdicao);
    });

    userForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(userForm);
        const data = Object.fromEntries(formData.entries());

        let url = '/api/usuarios';
        let method = 'POST';
        if (currentUserId) {
            url = `/api/usuarios/${currentUserId}`;
            method = 'PUT';
            if (!data.password) delete data.password;
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            // ALTERADO: Troca o alert pela notificação
            showNotification('Operação realizada com sucesso!', 'success');
            // Recarrega a página após um pequeno delay para a notificação ser vista
            setTimeout(() => location.reload(), 1500);
        } else {
            // ALTERADO: Troca o alert pela notificação
            const result = await response.json();
            showNotification(result.error || 'Falha na operação.', 'error');
        }
    });
    
    document.getElementById('btn-confirmar-remocao').addEventListener('click', async () => {
        const response = await fetch(`/api/usuarios/${currentUserId}`, { method: 'DELETE' });
        if (response.ok) {
            // ALTERADO: Troca o alert pela notificação
            showNotification('Usuário removido com sucesso!', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            // ALTERADO: Troca o alert pela notificação
            showNotification('Falha ao remover usuário.', 'error');
        }
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', event => {
            if (event.target === modal) closeModal(modal);
        });
    });
    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', () => closeModal(button.closest('.modal-overlay')));
    });
});