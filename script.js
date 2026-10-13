(() => {
    document.documentElement.classList.remove('no-js');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];

    /* Footer year */
    $$('.year').forEach(el => (el.textContent = new Date().getFullYear()));

    /* Nav: scrolled state, progress bar, active section */
    const nav = $('.nav');
    const onScroll = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        document.documentElement.style.setProperty('--p', max > 0 ? scrollY / max : 0);
        nav.classList.toggle('scrolled', scrollY > 30);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const links = $$('.nav-links a');
    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => sectionObserver.observe(s));

    /* Mobile menu */
    const toggle = $('.nav-toggle');
    const setMenu = open => {
        document.body.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', open);
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

    /* Reveal on scroll (staggered within each batch) */
    const revealObserver = new IntersectionObserver(entries => {
        entries.filter(e => e.isIntersecting).forEach((entry, i) => {
            entry.target.style.transitionDelay = `${Math.min(i * 80, 400)}ms`;
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => revealObserver.observe(el));

    /* Rotating hero word */
    const word = $('.rotator-word');
    const words = ['CI/CD pipelines', 'enterprise software', 'products people love', 'AI-powered tools'];
    let wi = 0;
    if (word && !reduceMotion) {
        setInterval(() => {
            word.classList.add('out');
            setTimeout(() => {
                wi = (wi + 1) % words.length;
                word.textContent = words[wi];
                word.classList.replace('out', 'in');
                requestAnimationFrame(() => requestAnimationFrame(() => word.classList.remove('in')));
            }, 400);
        }, 2600);
    }

    /* Count-up stats */
    const countObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseFloat(el.dataset.count);
            const decimals = parseInt(el.dataset.decimals || '0', 10);
            const duration = reduceMotion ? 0 : 1600;
            const start = performance.now();
            const tick = now => {
                const t = duration ? Math.min((now - start) / duration, 1) : 1;
                const eased = 1 - Math.pow(1 - t, 4);
                el.textContent = Number((target * eased).toFixed(decimals)).toLocaleString('en-US', { minimumFractionDigits: decimals }) + (t === 1 ? el.dataset.suffix || '' : '');
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            countObserver.unobserve(el);
        });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(el => countObserver.observe(el));

    /* Project slideshow */
    $$('.slideshow').forEach(show => {
        const slides = $$('img', show);
        let i = 0;
        if (reduceMotion || slides.length < 2) return;
        setInterval(() => {
            slides[i].classList.remove('active');
            i = (i + 1) % slides.length;
            slides[i].classList.add('active');
        }, parseInt(show.dataset.interval || '3000', 10));
    });

    /* Pointer effects: spotlight cards, tilt, magnetic buttons */
    if (finePointer && !reduceMotion) {
        $$('.spotlight').forEach(card => {
            card.addEventListener('pointermove', e => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${e.clientX - r.left}px`);
                card.style.setProperty('--my', `${e.clientY - r.top}px`);
            });
        });

        $$('.tilt').forEach(el => {
            el.addEventListener('pointermove', e => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                el.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
            });
            el.addEventListener('pointerleave', () => (el.style.transform = ''));
        });

        $$('.magnetic').forEach(btn => {
            btn.addEventListener('pointermove', e => {
                const r = btn.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2;
                const y = e.clientY - r.top - r.height / 2;
                btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
            });
            btn.addEventListener('pointerleave', () => (btn.style.transform = ''));
        });
    }

    /* Copy email */
    $$('.copy-email').forEach(btn => {
        const label = $('.copy-label', btn);
        btn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(btn.dataset.email);
                label.textContent = 'Copied ✓';
            } catch {
                label.textContent = btn.dataset.email;
            }
            btn.classList.add('copied');
            setTimeout(() => { label.textContent = 'Copy email'; btn.classList.remove('copied'); }, 2200);
        });
    });

    /* Certificate lightbox: every [data-full] trigger, in page order */
    const triggers = $$('[data-full]');
    const lb = $('.lightbox');
    const lbImg = $('img', lb);
    const lbCap = $('figcaption', lb);
    let current = 0;
    let lastFocus = null;

    const show = i => {
        current = (i + triggers.length) % triggers.length;
        const t = triggers[current];
        lbImg.src = t.dataset.full;
        lbImg.alt = t.dataset.caption;
        lbCap.textContent = t.dataset.caption;
    };
    const open = i => {
        lastFocus = document.activeElement;
        show(i);
        lb.hidden = false;
        requestAnimationFrame(() => lb.classList.add('open'));
        document.body.style.overflow = 'hidden';
        $('.lb-close', lb).focus();
    };
    const close = () => {
        lb.classList.remove('open');
        setTimeout(() => (lb.hidden = true), 300);
        document.body.style.overflow = '';
        lastFocus && lastFocus.focus();
    };

    triggers.forEach((el, i) => el.addEventListener('click', () => open(i)));
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', () => show(current - 1));
    $('.lb-next', lb).addEventListener('click', () => show(current + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => {
        if (lb.hidden) {
            if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
            return;
        }
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
        if (e.key === 'Tab') {
            const focusables = $$('button', lb);
            const first = focusables[0], last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });
})();
