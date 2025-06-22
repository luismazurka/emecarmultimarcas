// public/js/veiculo-public.js
document.addEventListener("DOMContentLoaded", () => {
    // A variável `allImageSources` é criada no final do veiculo.hbs
    if (typeof allImageSources === 'undefined' || allImageSources.length === 0) {
        return; // Não executa o script da galeria se não houver fotos
    }
    
    const mainImage = document.getElementById("main-image");
    const thumbnailContainer = document.getElementById("thumbnail-strip");
    const thumbnails = thumbnailContainer.querySelectorAll(".thumbnail");

    const galleryModal = document.getElementById("gallery-modal");
    const galleryMainPhoto = document.getElementById("gallery-main-photo");
    const btnCloseGallery = document.getElementById("close-gallery");
    const btnNextPhoto = document.getElementById("next-photo");
    const btnPrevPhoto = document.getElementById("prev-photo");

    let currentImageIndex = 0;
    const fullSizeSources = allImageSources.map(filename => `/uploads/${filename}`);

    function updateMainImage(index) {
        if (fullSizeSources[index]) {
            mainImage.src = fullSizeSources[index];
            currentImageIndex = index;
            thumbnails.forEach((thumb, i) => thumb.classList.toggle('active', i === index));
        }
    }

    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener("click", () => updateMainImage(index));
    });

    // Funções do Modal
    const openGallery = (index) => {
        galleryMainPhoto.src = fullSizeSources[index];
        galleryModal.style.display = 'flex';
    };
    const closeGallery = () => galleryModal.style.display = 'none';

    const showNextPhoto = () => {
        currentImageIndex = (currentImageIndex + 1) % fullSizeSources.length;
        galleryMainPhoto.src = fullSizeSources[currentImageIndex];
    };
    const showPrevPhoto = () => {
        currentImageIndex = (currentImageIndex - 1 + fullSizeSources.length) % fullSizeSources.length;
        galleryMainPhoto.src = fullSizeSources[currentImageIndex];
    };
    
    mainImage.parentElement.addEventListener('click', () => openGallery(currentImageIndex));
    btnCloseGallery.addEventListener('click', closeGallery);
    btnNextPhoto.addEventListener('click', showNextPhoto);
    btnPrevPhoto.addEventListener('click', showPrevPhoto);
    
    document.addEventListener('keydown', (e) => {
        if (galleryModal.style.display === 'flex') {
            if (e.key === 'ArrowRight') showNextPhoto();
            if (e.key === 'ArrowLeft') showPrevPhoto();
            if (e.key === 'Escape') closeGallery();
        }
    });
});