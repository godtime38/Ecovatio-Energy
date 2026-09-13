document.addEventListener('DOMContentLoaded', function () {
    var filters = document.querySelector('.portfolio-filters');
    if (filters) {
        filters.hidden = false;
        var cards = Array.from(document.querySelectorAll('.portfolio-card'));
        // Shuffle once per load; filters and pagination reuse this same order.
        for (var i = cards.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temporary = cards[i]; cards[i] = cards[j]; cards[j] = temporary;
        }
        function firstPageKey() {
            return cards.slice(0, 4).map(function (card) {
                return card.querySelector('a').getAttribute('href');
            }).sort().join('|');
        }
        try {
            // Avoid repeating the same four projects on consecutive reloads.
            if (cards.length > 4 && sessionStorage.getItem('ecovatio-project-selection') === firstPageKey()) {
                var replacement = 4 + Math.floor(Math.random() * (cards.length - 4));
                var replaced = cards[0]; cards[0] = cards[replacement]; cards[replacement] = replaced;
            }
            sessionStorage.setItem('ecovatio-project-selection', firstPageKey());
        } catch (error) { /* Random selection still works if storage is unavailable. */ }
        var grid = document.querySelector('.portfolio-grid');
        cards.forEach(function (card) { grid.appendChild(card); });
        var page = 0;
        var matching = cards.slice();
        var pager = document.createElement('nav');
        pager.className = 'portfolio-pagination';
        pager.setAttribute('aria-label', 'Páginas de proyectos');
        var previousPage = document.createElement('button');
        previousPage.type = 'button'; previousPage.textContent = '← Anterior';
        var pageLabel = document.createElement('span');
        var nextPage = document.createElement('button');
        nextPage.type = 'button'; nextPage.textContent = 'Siguiente →';
        pager.append(previousPage, pageLabel, nextPage);
        document.querySelector('.portfolio-count').after(pager);
        function renderPage() {
            var total = Math.max(1, Math.ceil(matching.length / 4));
            page = Math.max(0, Math.min(page, total - 1));
            cards.forEach(function (card) { card.hidden = true; });
            matching.slice(page * 4, page * 4 + 4).forEach(function (card) { card.hidden = false; });
            previousPage.disabled = page === 0;
            nextPage.disabled = page === total - 1;
            pageLabel.textContent = 'Página ' + (page + 1) + ' de ' + total;
            pager.hidden = total <= 1;
            document.querySelector('.portfolio-count').textContent = matching.length ?
                'Mostrando ' + (page * 4 + 1) + '–' + Math.min(page * 4 + 4, matching.length) + ' de ' + matching.length + ' proyectos' : 'No hay proyectos en esta categoría';
        }
        previousPage.addEventListener('click', function () { page--; renderPage(); });
        nextPage.addEventListener('click', function () { page++; renderPage(); });
        filters.querySelectorAll('button').forEach(function (button) {
            button.addEventListener('click', function () {
                filters.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === button); });
                matching = cards.filter(function (card) { return button.dataset.projectFilter === 'Todos' || card.dataset.category === button.dataset.projectFilter; });
                page = 0;
                renderPage();
            });
        });
        renderPage();
    }
    var dialog = document.querySelector('.project-lightbox');
    var photos = Array.from(document.querySelectorAll('[data-gallery-image]'));
    if (dialog && typeof dialog.showModal === 'function') {
        var current = 0;
        var opener;
        var previous = dialog.querySelector('[data-photo-prev]');
        var next = dialog.querySelector('[data-photo-next]');
        function render() {
            var img = dialog.querySelector('img');
            img.src = photos[current].href;
            img.alt = photos[current].querySelector('img').alt;
            dialog.querySelector('[data-photo-count]').textContent = (current + 1) + ' / ' + photos.length;
            previous.disabled = current === 0;
            next.disabled = current === photos.length - 1;
        }
        function move(delta) { current = Math.max(0, Math.min(photos.length - 1, current + delta)); render(); }
        photos.forEach(function (link, index) { link.addEventListener('click', function (event) {
            event.preventDefault(); current = index; opener = link; render(); dialog.showModal(); document.body.classList.add('project-lightbox-open');
        }); });
        previous.addEventListener('click', function () { move(-1); });
        next.addEventListener('click', function () { move(1); });
        dialog.querySelector('.lightbox-close').addEventListener('click', function () { dialog.close(); });
        dialog.addEventListener('close', function () { document.body.classList.remove('project-lightbox-open'); if (opener) opener.focus(); });
        dialog.addEventListener('keydown', function (event) { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); } });
        var startX, startY;
        dialog.querySelector('img').addEventListener('touchstart', function (event) { startX = event.changedTouches[0].clientX; startY = event.changedTouches[0].clientY; }, { passive: true });
        dialog.querySelector('img').addEventListener('touchend', function (event) { var dx = event.changedTouches[0].clientX - startX; var dy = event.changedTouches[0].clientY - startY; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1); }, { passive: true });
    }
    var form = document.getElementById('contact-form');
    var context = document.getElementById('contact-context') || form;
    var reference = new URLSearchParams(window.location.search).get('proyecto');
    if (form && reference) {
        reference = reference.slice(0, 160);
        var input = document.createElement('input'); input.type = 'hidden'; input.name = 'proyecto_referencia'; input.value = reference; form.appendChild(input);
        var note = document.createElement('p'); note.className = 'project-reference'; note.textContent = 'Me interesa un proyecto similar a: ' + reference; context.prepend(note);
    }
    var productReference = new URLSearchParams(window.location.search).get('producto');
    if (form && productReference) {
        productReference = productReference.slice(0, 220);
        var productInput = document.createElement('input'); productInput.type = 'hidden'; productInput.name = 'producto_referencia'; productInput.value = productReference; form.appendChild(productInput);
        var productNote = document.createElement('p'); productNote.className = 'project-reference'; productNote.textContent = 'Producto de interés: ' + productReference; context.prepend(productNote);
        var interest = form.querySelector('select[name="interes"]');
        if (interest) interest.value = 'producto';
    }
});
