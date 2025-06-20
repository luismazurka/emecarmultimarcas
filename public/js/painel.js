document.addEventListener('DOMContentLoaded', () => {
    const board = document.querySelector('.kanban-board');
    if (!board) return;

    let draggedCard = null;

    board.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('kanban-card')) {
            draggedCard = e.target;
            setTimeout(() => {
                e.target.classList.add('dragging');
            }, 0);
        }
    });

    board.addEventListener('dragend', (e) => {
        if (draggedCard) {
            draggedCard.classList.remove('dragging');
            draggedCard = null;
        }
    });

    board.addEventListener('dragover', (e) => {
        e.preventDefault();
        const column = e.target.closest('.kanban-column');
        if (column) {
            const list = column.querySelector('.kanban-list');
            list.classList.add('drag-over');
        }
    });

    board.addEventListener('dragleave', (e) => {
        const column = e.target.closest('.kanban-column');
        if (column) {
            const list = column.querySelector('.kanban-list');
            list.classList.remove('drag-over');
        }
    });

    board.addEventListener('drop', async (e) => {
        e.preventDefault();
        const column = e.target.closest('.kanban-column');
        if (column && draggedCard) {
            const list = column.querySelector('.kanban-list');
            list.classList.remove('drag-over');
            
            const vehicleId = draggedCard.dataset.id;
            const newStatus = column.dataset.status;

            // Mover o card visualmente
            list.appendChild(draggedCard);

            // Enviar a atualização para o servidor
            try {
                const response = await fetch(`/api/veiculos/${vehicleId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus }),
                });

                if (!response.ok) {
                    throw new Error('Falha ao atualizar o status.');
                }
                
                // Atualizar contadores
                document.querySelectorAll('.kanban-column').forEach(col => {
                    const countSpan = col.querySelector('.count');
                    const cardCount = col.querySelectorAll('.kanban-card').length;
                    countSpan.textContent = cardCount;
                });

            } catch (error) {
                console.error('Erro:', error);
                alert('Não foi possível atualizar o status. Por favor, recarregue a página.');
                location.reload(); // Recarrega para reverter a mudança visual
            }
        }
    });

    // Filtro de busca
    const searchInput = document.getElementById('kanbanSearchInput');
    searchInput.addEventListener('keyup', () => {
        const searchTerm = searchInput.value.toLowerCase();
        document.querySelectorAll('.kanban-card').forEach(card => {
            const cardText = card.textContent.toLowerCase();
            card.style.display = cardText.includes(searchTerm) ? '' : 'none';
        });
    });
});
