// public/js/veiculos-public.js
document.addEventListener("DOMContentLoaded", () => {
    const btnBackToTop = document.getElementById("btn-back-to-top");
    const filterSidebar = document.querySelector(".filter-sidebar");
    
    // Lógica do botão "Voltar ao topo"
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            btnBackToTop.style.display = 'flex';
        } else {
            btnBackToTop.style.display = 'none';
        }
    });

    btnBackToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Lógica para habilitar/desabilitar botão de aplicar filtro
    const btnApply = document.getElementById("btn-apply");
    const btnClear = document.getElementById("btn-clear");
    const filterInputs = filterSidebar.querySelectorAll('input');

    const checkFilterSelection = () => {
        const anySelected = Array.from(filterInputs).some(inp => {
            if (inp.type === 'checkbox') return inp.checked;
            if (inp.type === 'number') return inp.value.trim() !== '';
            return false;
        });
        btnApply.disabled = !anySelected;
    };

    filterInputs.forEach(input => {
        input.addEventListener('input', checkFilterSelection);
        input.addEventListener('change', checkFilterSelection);
    });

    btnClear.addEventListener('click', () => {
        filterSidebar.querySelector('form').reset();
        checkFilterSelection();
    });

    // Nota: A lógica para realmente aplicar os filtros via API será implementada depois.
    // Por enquanto, o formulário não fará nada ao ser enviado.
    // NOVO CÓDIGO para o veiculos-public.js

// Ação ao enviar o formulário (clicar em "Aplicar Filtros")
// NOVO CÓDIGO CORRIGIDO para o veiculos-public.js

// Ação ao enviar o formulário (clicar em "Aplicar Filtros")
filterSidebar.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault(); // Impede o recarregamento padrão

    // 1. Começa com uma URL "limpa", contendo apenas o caminho base.
    const baseUrl = window.location.origin + window.location.pathname;
    const newUrl = new URL(baseUrl);

    // 2. Preserva o parâmetro de ordenação ('sort'), se ele existir na URL atual.
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.has('sort')) {
        newUrl.searchParams.set('sort', currentParams.get('sort'));
    }

    // 3. Adiciona os filtros ATUAIS do formulário à URL limpa.
    const formData = new FormData(e.target);
    for (const [key, value] of formData.entries()) {
        if (value) { // Adiciona apenas se o campo tiver um valor
            newUrl.searchParams.append(key, value);
        }
    }

    // 4. Redireciona o navegador para a nova URL, que agora é sempre consistente.
    window.location.href = newUrl.toString();
});




     // --- CÓDIGO NOVO PARA A ORDENAÇÃO ---
    const sortDropdown = document.getElementById("sort-by");

    sortDropdown.addEventListener("change", function() {
        const selectedValue = this.value;
        
        // Pega a URL atual e adiciona o parâmetro de ordenação
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('sort', selectedValue);
        
        // Redireciona para a nova URL
        window.location.href = currentUrl.toString();
    });




});