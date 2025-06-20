document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe 'active' de todos
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Adiciona a classe 'active' ao botão clicado e ao seu conteúdo
            button.classList.add('active');
            const targetContent = document.getElementById(button.dataset.tab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
});
