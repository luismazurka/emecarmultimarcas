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

    let currentUserId = null; // Para saber qual usuário estamos editando ou removendo

    // Funções para abrir e fechar modais
    const openModal = (modal) => modal.classList.remove('hidden');
    const closeModal = (modal) => modal.classList.add('hidden');

    // Adiciona evento de clique na tabela para lidar com as ações (Event Delegation)
    userTableBody.addEventListener('click', async (event) => {
        const target = event.target.closest('.btn-action');
        if (!target) return;

        const row = target.closest('tr');
        currentUserId = row.dataset.id;

        if (target.classList.contains('btn-view')) {
            // Ação de Visualizar
            const response = await fetch(`/api/usuarios/${currentUserId}`);
            const user = await response.json();
            document.getElementById('view-name').textContent = user.name;
            document.getElementById('view-role').textContent = user.role;
            document.getElementById('view-date').textContent = new Date(user.createdAt).toLocaleDateString('pt-BR');
            openModal(modalVisualizacao);
        } 
        else if (target.classList.contains('btn-edit')) {
            // Ação de Editar
            const response = await fetch(`/api/usuarios/${currentUserId}`);
            const user = await response.json();
            modalTitle.textContent = 'Editar Usuário';
            document.getElementById('user-name').value = user.name;
            document.getElementById('user-role').value = user.role.toLowerCase();
            passwordField.required = false; // Senha não é obrigatória na edição
            passwordLabel.textContent = 'Nova Senha (deixe em branco para não alterar)';
            openModal(modalCadastroEdicao);
        } 
        else if (target.classList.contains('btn-delete')) {
            // Ação de Remover
            const userName = row.querySelector('td').textContent;
            document.getElementById('delete-user-name').textContent = userName;
            openModal(modalRemocao);
        }
    });

    // Botão para abrir modal de Cadastro
    btnCadastrar.addEventListener('click', () => {
        currentUserId = null; // Garante que estamos no modo de cadastro
        modalTitle.textContent = 'Cadastrar Novo Usuário';
        userForm.reset();
        passwordField.required = true;
        passwordLabel.textContent = 'Senha';
        openModal(modalCadastroEdicao);
    });

    // Submissão do formulário de Cadastro/Edição
    userForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(userForm);
        const data = Object.fromEntries(formData.entries());

        // Define a URL e o método (POST para criar, PUT para editar)
        let url = '/api/usuarios';
        let method = 'POST';
        if (currentUserId) {
            url = `/api/usuarios/${currentUserId}`;
            method = 'PUT';
            // Se a senha estiver vazia na edição, não a envie
            if (!data.password) delete data.password;
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Operação realizada com sucesso!');
            location.reload(); // Recarrega a página para ver as mudanças
        } else {
            alert('Falha na operação.');
        }
    });
    
    // Confirmação de Remoção
    document.getElementById('btn-confirmar-remocao').addEventListener('click', async () => {
        const response = await fetch(`/api/usuarios/${currentUserId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Usuário removido com sucesso!');
            location.reload();
        } else {
            alert('Falha ao remover usuário.');
        }
    });

    // Lógica para fechar todos os modais
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', event => {
            if (event.target === modal) closeModal(modal);
        });
    });
    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', () => closeModal(button.closest('.modal-overlay')));
    });
});