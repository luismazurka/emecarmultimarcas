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
    filterSidebar.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('A funcionalidade de filtro será implementada em breve!');
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