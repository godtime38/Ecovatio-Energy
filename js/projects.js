document.addEventListener('DOMContentLoaded', function () {
    var filters = document.querySelector('.portfolio-filters');
    if (filters) {
        filters.hidden = false;
        var cards = Array.from(document.querySelectorAll('.portfolio-card'));
        filters.querySelectorAll('button').forEach(function (button) {
            button.addEventListener('click', function () {
                filters.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === button); });
                cards.forEach(function (card) { card.hidden = button.dataset.projectFilter !== 'Todos' && card.dataset.category !== button.dataset.projectFilter; });
                var count = cards.filter(function (card) { return !card.hidden; }).length;
                document.querySelector('.portfolio-count').textContent = count + (count === 1 ? ' proyecto' : ' proyectos');
            });
        });
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
