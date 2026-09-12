/* ---------- Deferred desktop video; the poster is always available ---------- */
(function () {
    window.addEventListener('load', function () {
        var video = document.querySelector('.hero__video');
        if (!video || !window.matchMedia('(min-width: 901px)').matches ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            (navigator.connection && navigator.connection.saveData)) return;
        var source = video.querySelector('source[data-src]');
        if (!source) return;
        video.addEventListener('playing', function () { video.classList.add('is-playing'); }, { once: true });
        source.src = source.dataset.src;
        video.load();
        video.play().catch(function () { /* Keep the poster if autoplay is blocked. */ });
    });
})();

document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Ícono SVG desde el sprite (#i-sol, #i-rayo, #i-bateria...) ---------- */
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var XLINK_NS = 'http://www.w3.org/1999/xlink';

    function makeIcon(id, className) {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', className || 'icon');
        var use = document.createElementNS(SVG_NS, 'use');
        use.setAttributeNS(XLINK_NS, 'xlink:href', '#' + id);
        use.setAttribute('href', '#' + id);
        svg.appendChild(use);
        return svg;
    }

    /* ---------- Tema claro / oscuro ---------- */
    var themeBtn = document.getElementById('theme-toggle');

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.dataset.theme = 'dark';
            if (themeBtn) themeBtn.textContent = '☀';
        } else {
            delete document.body.dataset.theme;
            if (themeBtn) themeBtn.textContent = '☾';
        }
    }

    try { applyTheme(localStorage.getItem('ecovatio-theme')); } catch (e) { applyTheme('light'); }

    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem('ecovatio-theme', next); } catch (e) { /* Storage may be unavailable. */ }
            applyTheme(next);
        });
    }
    /* ---------- Nav que baja al hacer scroll ---------- */
    var nav = document.querySelector('.nav--overlay');
    var hero = document.querySelector('.hero');

    if (nav) {
        var TRIGGER_RATIO = 0.65;   // 0.65 = aparece al 65% del hero (1 = al final)
        var trigger = 400;
        var isFixed = false;
        var ticking = false;

        function measure() {
            trigger = hero ? Math.max(120, hero.offsetHeight * TRIGGER_RATIO) : 400;
        }

        function checkNav() {
            var y = window.scrollY;

            if (!isFixed && y > trigger) {
                isFixed = true;
                nav.classList.add('nav--fixed');
            } else if (isFixed && y < trigger - 80) {   // margen para evitar parpadeo
                isFixed = false;
                nav.classList.remove('nav--fixed');
                if (navLinks && navLinks.classList.contains('open')) {
                    navLinks.classList.remove('open');
                    burger.setAttribute('aria-expanded', 'false');
                    burger.textContent = '☰';
                }
            }
            ticking = false;
        }

        measure();
        checkNav();

        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(checkNav); }
        }, { passive: true });

        window.addEventListener('resize', function () { measure(); checkNav(); });
    }

    /* ---------- Menú móvil ---------- */
    var burger = document.getElementById('nav-burger');
    var navLinks = document.getElementById('nav-links');

    if (burger && navLinks) {
        burger.addEventListener('click', function () {
            var open = navLinks.classList.toggle('open');
            burger.setAttribute('aria-expanded', open);
            burger.textContent = open ? '✕' : '☰';
        });
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('open');
                burger.setAttribute('aria-expanded', 'false');
                burger.textContent = '☰';
            });
        });
    }

    /* ---------- Sistemas / productos (desde JSON) + filtro Todos / Paneles / Baterías / Inversores ---------- */
    var sistemasFilter = document.getElementById('sistemas-filter');
    var sistemasGrid = document.getElementById('sistemas-grid');

    if (sistemasFilter && sistemasGrid) {
        fetch('/assets/data/sistemas.json')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                sistemasGrid.replaceChildren();
                var allBtn = document.createElement('button');
                allBtn.className = 'filter-btn active';
                allBtn.dataset.filter = 'todos';
                allBtn.textContent = 'Todos';
                sistemasFilter.appendChild(allBtn);

                data.categorias.forEach(function (cat) {
                    var btn = document.createElement('button');
                    btn.className = 'filter-btn';
                    btn.dataset.filter = cat.slug;
                    btn.appendChild(makeIcon(cat.icono, 'icon'));
                    btn.appendChild(document.createTextNode(cat.nombre));
                    sistemasFilter.appendChild(btn);

                    cat.productos.forEach(function (p) {
                        var card = document.createElement('div');
                        card.className = 'product-card reveal';
                        card.dataset.category = cat.slug;

                        var imgWrap = document.createElement('div');
                        imgWrap.className = 'product-card__img';
                        var img = document.createElement('img');
                        img.src = p.img;
                        img.alt = p.alt || p.titulo;
                        img.loading = 'lazy';
                        img.width = 800;
                        img.height = 800;
                        img.addEventListener('error', function () {
                            var badge = document.createElement('div');
                            badge.className = 'product-card__badge';
                            badge.textContent = p.tag;
                            imgWrap.replaceChild(badge, img);
                        });
                        imgWrap.appendChild(img);

                        var body = document.createElement('div');
                        body.className = 'product-card__body';

                        var tag = document.createElement('div');
                        tag.className = 'product-card__tag';
                        tag.textContent = p.tag;

                        var title = document.createElement('h3');
                        title.className = 'product-card__title';
                        title.textContent = p.titulo;

                        var desc = document.createElement('p');
                        desc.className = 'product-card__desc';
                        desc.textContent = p.descripcion;

                        var meta = document.createElement('div');
                        meta.className = 'product-card__meta';

                        var spec = document.createElement('span');
                        spec.className = 'product-card__spec';
                        spec.textContent = p.spec;

                        var link = document.createElement('a');
                        link.className = 'product-card__link';
                        link.href = '#contacto';
                        link.textContent = 'Solicitar cotización →';

                        meta.appendChild(spec);
                        meta.appendChild(link);
                        body.appendChild(tag);
                        body.appendChild(title);
                        body.appendChild(desc);
                        body.appendChild(meta);

                        card.appendChild(imgWrap);
                        card.appendChild(body);
                        sistemasGrid.appendChild(card);
                    });
                });

                var productCards = sistemasGrid.querySelectorAll('.product-card');

                if (!('IntersectionObserver' in window)) {
                    productCards.forEach(function (el) { el.classList.add('in'); });
                } else {
                    var sistemasObserver = new IntersectionObserver(function (entries) {
                        entries.forEach(function (entry) {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('in');
                                sistemasObserver.unobserve(entry.target);
                            }
                        });
                    }, { threshold: 0.12 });
                    productCards.forEach(function (el) { sistemasObserver.observe(el); });
                }

                /* ---------- Paginación: solo 4 cards visibles a la vez dentro del filtro activo ---------- */
                var PAGE_SIZE = 4;
                var pager = document.getElementById('sistemas-pager');
                var prevBtn = document.getElementById('sistemas-prev');
                var nextBtn = document.getElementById('sistemas-next');
                var pageStatus = document.getElementById('sistemas-page-status');
                var currentMatches = Array.prototype.slice.call(productCards);
                var currentPage = 0;

                function renderPage() {
                    var totalPages = Math.max(1, Math.ceil(currentMatches.length / PAGE_SIZE));
                    currentPage = Math.min(currentPage, totalPages - 1);
                    var start = currentPage * PAGE_SIZE;
                    var end = start + PAGE_SIZE;

                    productCards.forEach(function (card) { card.classList.add('is-hidden'); });
                    currentMatches.slice(start, end).forEach(function (card) { card.classList.remove('is-hidden'); });

                    pageStatus.textContent = (currentPage + 1) + ' / ' + totalPages;
                    prevBtn.disabled = currentPage === 0;
                    nextBtn.disabled = currentPage === totalPages - 1;
                    pager.hidden = totalPages <= 1;
                }

                prevBtn.addEventListener('click', function () { currentPage--; renderPage(); });
                nextBtn.addEventListener('click', function () { currentPage++; renderPage(); });

                sistemasFilter.querySelectorAll('.filter-btn').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        sistemasFilter.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
                        btn.classList.add('active');

                        var filter = btn.dataset.filter;
                        currentMatches = Array.prototype.filter.call(productCards, function (card) {
                            return filter === 'todos' || card.dataset.category === filter;
                        });
                        currentPage = 0;
                        renderPage();
                    });
                });

                renderPage();
            })
            .catch(function () {
                // Keep the static catalog available when the network is unavailable.
            });
    }

    /* ---------- Proyectos realizados (desde JSON) ---------- */
    var projectsFeature = document.getElementById('projects-feature');
    var projectsRail = document.getElementById('projects-rail');

    if (projectsFeature && projectsRail) {
        fetch('/assets/data/proyectos.json')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var proyectos = data.proyectos;
                var activeIndex = 0;
                var activeImageIndex = 0;

                function pad(n) { return (n < 10 ? '0' : '') + n; }

                function imagesOf(p) {
                    return (p.images && p.images.length) ? p.images : [p.img];
                }

                function describe(p) {
                    return 'Instalación ' + p.categoria.toLowerCase() + ' de ' + p.kwp + ' kWp con ' +
                        p.paneles + ' paneles solares en ' + p.ciudad + '.';
                }

                function renderFeature() {
                    var p = proyectos[activeIndex];
                    var images = imagesOf(p);
                    if (activeImageIndex >= images.length) activeImageIndex = 0;

                    projectsFeature.innerHTML = '';

                    var media = document.createElement('div');
                    media.className = 'projects-feature__media';

                    var img = document.createElement('img');
                    img.src = images[activeImageIndex];
                    img.srcset = images[activeImageIndex].replace('.webp', '-medium.webp') + ' 800w, ' + images[activeImageIndex] + ' 1440w';
                    img.sizes = '(max-width: 900px) calc(100vw - 40px), 60vw';
                    img.width = 1440;
                    img.height = 1080;
                    img.alt = p.alt || p.ciudad;
                    img.loading = 'lazy';
                    media.appendChild(img);

                    if (images.length > 1) {
                        var prevImg = document.createElement('button');
                        prevImg.type = 'button';
                        prevImg.className = 'projects-feature__nav projects-feature__nav--prev';
                        prevImg.setAttribute('aria-label', 'Foto anterior');
                        prevImg.innerHTML = '&#8249;';
                        prevImg.addEventListener('click', function () {
                            activeImageIndex = (activeImageIndex - 1 + images.length) % images.length;
                            renderFeature();
                        });

                        var nextImg = document.createElement('button');
                        nextImg.type = 'button';
                        nextImg.className = 'projects-feature__nav projects-feature__nav--next';
                        nextImg.setAttribute('aria-label', 'Foto siguiente');
                        nextImg.innerHTML = '&#8250;';
                        nextImg.addEventListener('click', function () {
                            activeImageIndex = (activeImageIndex + 1) % images.length;
                            renderFeature();
                        });

                        var dots = document.createElement('div');
                        dots.className = 'projects-feature__dots';
                        images.forEach(function (_, i) {
                            var dot = document.createElement('span');
                            dot.className = 'projects-feature__dot' + (i === activeImageIndex ? ' is-active' : '');
                            dots.appendChild(dot);
                        });

                        media.appendChild(prevImg);
                        media.appendChild(nextImg);
                        media.appendChild(dots);
                    }

                    var info = document.createElement('div');
                    info.className = 'projects-feature__info';
                    info.innerHTML =
                        '<div class="projects-feature__index">Proyecto ' + pad(activeIndex + 1) + ' / ' + pad(proyectos.length) + '</div>' +
                        '<h3 class="projects-feature__title">' + p.ciudad + '</h3>' +
                        '<p class="projects-feature__desc">' + describe(p) + '</p>' +
                        '<div class="projects-feature__divider"></div>' +
                        '<div class="projects-feature__stats">' +
                        '<div><span>Tecnología</span><strong>' + p.categoria + '</strong></div>' +
                        '<div><span>Potencia</span><strong>' + p.kwp + ' kWp</strong></div>' +
                        '<div><span>Ubicación</span><strong>' + p.ciudad + '</strong></div>' +
                        '<div><span>Puesta en marcha</span><strong>' + (p.anio || '—') + '</strong></div>' +
                        '</div>' +
                        '<a href="#contacto" class="btn btn--primary">Solicitar un proyecto similar →</a>';

                    projectsFeature.appendChild(media);
                    projectsFeature.appendChild(info);
                }

                function updateRailActive() {
                    projectsRail.querySelectorAll('.projects-rail__item').forEach(function (el, i) {
                        el.classList.toggle('is-active', i === activeIndex);
                    });
                }

                function renderRail() {
                    projectsRail.innerHTML = '';
                    proyectos.forEach(function (p, i) {
                        var images = imagesOf(p);
                        var item = document.createElement('button');
                        item.type = 'button';
                        item.className = 'projects-rail__item' + (i === activeIndex ? ' is-active' : '');
                        item.innerHTML =
                            '<span class="projects-rail__thumb"><img src="' + images[0].replace('.webp', '-thumb.webp') + '" alt="' + (p.alt || p.ciudad) + '" loading="lazy" width="360" height="240"></span>' +
                            '<span class="projects-rail__num">' + pad(i + 1) + '</span>' +
                            '<span class="projects-rail__city">' + p.ciudad + '</span>' +
                            '<span class="projects-rail__meta">' + p.categoria + (p.anio ? ' · ' + p.anio : '') + '</span>';
                        item.addEventListener('click', function () {
                            activeIndex = i;
                            activeImageIndex = 0;
                            renderFeature();
                            updateRailActive();
                        });
                        projectsRail.appendChild(item);
                    });
                }

                var railPrev = document.getElementById('projects-rail-prev');
                var railNext = document.getElementById('projects-rail-next');
                if (railPrev) railPrev.addEventListener('click', function () { projectsRail.scrollBy({ left: -300, behavior: 'smooth' }); });
                if (railNext) railNext.addEventListener('click', function () { projectsRail.scrollBy({ left: 300, behavior: 'smooth' }); });

                renderFeature();
                renderRail();
            })
            .catch(function () {
                projectsFeature.innerHTML = '<p style="color:var(--mut)">No se pudieron cargar los proyectos en este momento.</p>';
            });
    }

    /* ---------- Cinta de marcas con animación infinita (al pie de "Sistemas") ---------- */
    var brandStripTrack = document.getElementById('brand-strip-track');

    if (brandStripTrack) {
        fetch('/assets/data/marcas.json')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var seen = {};
                var brands = [];
                data.categorias.forEach(function (cat) {
                    cat.marcas.forEach(function (marca) {
                        if (seen[marca.nombre]) return;
                        seen[marca.nombre] = true;
                        brands.push(marca);
                    });
                });

                function buildItem(marca) {
                    var item = document.createElement('div');
                    item.className = 'brand-strip__item';

                    var img = document.createElement('img');
                    img.src = marca.img;
                    img.alt = marca.nombre;
                    img.loading = 'lazy';
                    img.width = 130;
                    img.height = 40;
                    img.addEventListener('error', function () {
                        var badge = document.createElement('div');
                        badge.className = 'brand-strip__badge';
                        badge.textContent = marca.nombre;
                        item.replaceChild(badge, img);
                    });
                    item.appendChild(img);
                    return item;
                }

                // la lista se duplica para que translateX(-50%) sea un loop continuo sin salto visible
                brands.concat(brands).forEach(function (marca) {
                    brandStripTrack.appendChild(buildItem(marca));
                });
            })
            .catch(function () {
                var wrap = brandStripTrack.closest('.brand-strip-wrap');
                if (wrap) wrap.style.display = 'none';
            });
    }

    /* ---------- Marcas y fabricantes (página /pages/marcas.html) ---------- */
    var marcasWrap = document.getElementById('marcas-wrap');

    if (marcasWrap) {
        fetch('/assets/data/marcas.json')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                data.categorias.forEach(function (cat) {
                    var section = document.createElement('div');
                    section.className = 'brand-category reveal';
                    section.id = cat.slug;

                    var head = document.createElement('div');
                    head.className = 'brand-category__head';

                    var icon = document.createElement('span');
                    icon.className = 'brand-category__icon';
                    icon.appendChild(makeIcon(cat.icono, 'icon'));

                    var title = document.createElement('h2');
                    title.className = 'brand-category__title';
                    title.textContent = cat.nombre;

                    head.appendChild(icon);
                    head.appendChild(title);
                    section.appendChild(head);

                    var grid = document.createElement('div');
                    grid.className = 'brand-grid';

                    cat.marcas.forEach(function (marca) {
                        var card = document.createElement('a');
                        card.className = 'brand-card';
                        card.href = marca.url;
                        card.target = '_blank';
                        card.rel = 'noopener';

                        var logoWrap = document.createElement('div');
                        logoWrap.className = 'brand-card__logo';

                        var img = document.createElement('img');
                        img.src = marca.img;
                        img.alt = marca.nombre;
                        img.loading = 'lazy';
                        img.addEventListener('error', function () {
                            var badge = document.createElement('div');
                            badge.className = 'brand-card__badge';
                            badge.textContent = marca.nombre.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
                            logoWrap.replaceChild(badge, img);
                        });
                        logoWrap.appendChild(img);

                        var name = document.createElement('div');
                        name.className = 'brand-card__name';
                        name.textContent = marca.nombre;

                        var link = document.createElement('div');
                        link.className = 'brand-card__link';
                        link.textContent = 'Visitar sitio →';

                        card.appendChild(logoWrap);
                        card.appendChild(name);
                        card.appendChild(link);
                        grid.appendChild(card);
                    });

                    section.appendChild(grid);
                    marcasWrap.appendChild(section);
                });

                if (!('IntersectionObserver' in window)) {
                    marcasWrap.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
                } else {
                    var marcasObserver = new IntersectionObserver(function (entries) {
                        entries.forEach(function (entry) {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('in');
                                marcasObserver.unobserve(entry.target);
                            }
                        });
                    }, { threshold: 0.1 });
                    marcasWrap.querySelectorAll('.reveal').forEach(function (el) { marcasObserver.observe(el); });
                }
            })
            .catch(function () {
                marcasWrap.innerHTML = '<p style="color:var(--mut)">No se pudieron cargar las marcas en este momento.</p>';
            });
    }

    /* ---------- FAQ (acordeón) ---------- */
    document.querySelectorAll('.faq-item__q').forEach(function (btn, index) {
        var answer = btn.closest('.faq-item').querySelector('.faq-item__a');
        answer.id = 'faq-answer-' + index;
        btn.setAttribute('aria-controls', answer.id);
        btn.setAttribute('aria-expanded', btn.closest('.faq-item').classList.contains('open'));
        btn.addEventListener('click', function () {
            var item = btn.closest('.faq-item');
            var wasOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item.open').forEach(function (o) { o.classList.remove('open'); });
            if (!wasOpen) item.classList.add('open');
            document.querySelectorAll('.faq-item__q').forEach(function (question) {
                question.setAttribute('aria-expanded', question.closest('.faq-item').classList.contains('open'));
            });
        });
    });

    /* ---------- Calculadora de ahorro ---------- */
    var kwhInput = document.getElementById('calc-kwh');
    var billInput = document.getElementById('calc-bill');
    var seg = document.getElementById('calc-seg');

    if (kwhInput && billInput) {
        var SAVING_PCT = { residencial: 0.85, comercial: 0.75, industrial: 0.65 };
        var COST_PER_KW = 68000;   // RD$ por kWp instalado (referencial)
        var KWH_PER_KW = 130;      // producción mensual aprox. por kWp en RD
        var YIELD_YEAR = KWH_PER_KW * 12; // Keep sizing and investment assumptions consistent.
        var CO2_FACTOR = 0.5;      // kg CO2 por kWh

        var prop = 'residencial';
        var calculatorUsed = false;

        var outMonthly = document.getElementById('calc-monthly');
        var outYearly = document.getElementById('calc-yearly');
        var outRoi = document.getElementById('calc-roi');
        var outRoiBar = document.getElementById('calc-roi-bar');
        var outKwp = document.getElementById('out-kwp');
        var outCo2 = document.getElementById('out-co2');
        var outKwhDisplay = document.getElementById('calc-kwh-out');
        var outBillDisplay = document.getElementById('calc-bill-out');
        var outNewBill = document.getElementById('calc-newbill');

        function fmt(n) { return 'RD$ ' + Math.round(n).toLocaleString('es-DO'); }

        function calculate() {
            var kwh = Math.max(0, parseFloat(kwhInput.value) || 0);
            var bill = Math.max(0, parseFloat(billInput.value) || 0);

            var monthly = bill * SAVING_PCT[prop];
            var yearly = monthly * 12;

            outMonthly.textContent = fmt(monthly);
            outYearly.textContent = fmt(yearly);

            if (outKwhDisplay) outKwhDisplay.textContent = Math.round(kwh).toLocaleString('es-DO') + ' kWh';
            if (outBillDisplay) outBillDisplay.textContent = fmt(bill);
            if (outNewBill) outNewBill.textContent = fmt(Math.max(0, bill - monthly));

            var sysCost = (kwh / KWH_PER_KW) * COST_PER_KW;
            if (yearly > 0 && sysCost > 0) {
                var roi = sysCost / yearly;
                var clamped = Math.min(10, Math.max(0.5, roi));
                outRoi.textContent = roi.toFixed(1) + ' años';
                outRoiBar.style.width = (clamped / 10 * 100).toFixed(0) + '%';
            } else {
                outRoi.textContent = '—';
                outRoiBar.style.width = '0%';
            }

            if (outKwp) outKwp.textContent = ((kwh * 12) / YIELD_YEAR).toFixed(2) + ' kWp';
            if (outCo2) outCo2.textContent = Math.round(kwh * 12 * CO2_FACTOR).toLocaleString('es-DO') + ' kg/año';
        }

        kwhInput.addEventListener('input', function () { calculatorUsed = true; calculate(); });
        billInput.addEventListener('input', function () { calculatorUsed = true; calculate(); });

        if (seg) {
            seg.querySelectorAll('.seg__btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    calculatorUsed = true;
                    prop = btn.dataset.prop;
                    seg.querySelectorAll('.seg__btn').forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    calculate();
                });
            });
        }

        calculate();
    }

    /* ---------- Formulario de contacto (AJAX) ---------- */
    var contactForm = document.getElementById('contact-form');
    var formStatus = document.getElementById('form-status');

    if (contactForm && formStatus) {
        var submitting = false;
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (submitting) return;
            submitting = true;
            var submitButton = contactForm.querySelector('[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando…';
            contactForm.setAttribute('aria-busy', 'true');
            formStatus.classList.remove('show');
            var payload = new FormData(contactForm);
            if (kwhInput && billInput && calculatorUsed) {
                payload.set('consumo_kwh', kwhInput.value);
                payload.set('factura_rd', billInput.value);
                payload.set('tipo_propiedad', prop);
            }
            fetch(contactForm.action, {
                method: contactForm.method,
                body: payload,
                headers: { 'Accept': 'application/json' }
            }).then(function (response) {
                if (response.ok) {
                    formStatus.textContent = '✓ Datos recibidos. Le contactaremos pronto.';
                    formStatus.classList.add('show');
                    contactForm.reset();
                } else {
                    throw new Error('Submission failed');
                }
            }).catch(function () {
                formStatus.textContent = 'No se pudo enviar. Sus datos se conservan: inténtelo de nuevo o contáctenos por WhatsApp.';
                formStatus.classList.add('show');
            }).finally(function () {
                submitting = false;
                submitButton.disabled = false;
                submitButton.textContent = 'Solicitar cotización →';
                contactForm.removeAttribute('aria-busy');
            });
        });
    }

    /* ---------- Botón volver arriba ---------- */
    var topBtn = document.getElementById('widget-top');

    if (topBtn) {
        window.addEventListener('scroll', function () {
            topBtn.classList.toggle('show', window.scrollY > 600);
        }, { passive: true });

        topBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------- Animación al hacer scroll ---------- */
    if ('IntersectionObserver' in window) {
        document.documentElement.classList.add('js');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });
    } else {
        document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    }
});
