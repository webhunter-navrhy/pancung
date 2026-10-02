document.addEventListener('DOMContentLoaded', () => {
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const nf = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const fmt = (n) => nf.format(Math.round(n)).replace(/\s/g, ' ');

  /* ─── Nav + FAB ─── */
  const nav = document.getElementById('nav');
  const fab = document.querySelector('.fab');
  const hero = document.querySelector('.hero');
  const contact = document.getElementById('kontakt');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 60);
    const pastHero = y > hero.offsetHeight * 0.8;
    const r = contact.getBoundingClientRect();
    const atContact = r.top < window.innerHeight && r.bottom > 0;
    fab.classList.toggle('show', pastHero && !atContact);
  };

  /* ─── Mobile menu ─── */
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  let lenis = null;
  const setMenu = (open) => {
    menu.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ─── Calculator ─── */
  const $ = (id) => document.getElementById(id);
  const inputs = { once: $('c-once'), month: $('c-month'), years: $('c-years'), rate: $('c-rate') };
  const shown = { total: 0, inv: 0, gain: 0 };
  const yearsWord = (n) => n === 1 ? 'rok' : (n >= 2 && n <= 4 ? 'roky' : 'let');

  const series = (P, M, years, ratePct) => {
    const rm = Math.pow(1 + ratePct / 100, 1 / 12) - 1;
    const pts = [];
    let v = P;
    pts.push({ v, inv: P });
    for (let m = 1; m <= years * 12; m++) {
      v = v * (1 + rm) + M;
      if (m % 3 === 0 || m === years * 12) pts.push({ v, inv: P + M * m });
    }
    return pts;
  };

  const path = (pts, key, max) => pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * 600;
    const y = 236 - (p[key] / max) * 216;
    return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  }).join(' ');

  const setFill = (el) => {
    const p = ((el.value - el.min) / (el.max - el.min)) * 100;
    el.style.setProperty('--p', p + '%');
  };

  const renderNumbers = () => {
    $('r-total').textContent = fmt(shown.total);
    $('r-in').textContent = fmt(shown.inv) + ' Kč';
    $('r-gain').textContent = fmt(shown.gain) + ' Kč';
  };

  const updateCalc = (animate) => {
    const P = +inputs.once.value, M = +inputs.month.value, Y = +inputs.years.value, R = +inputs.rate.value;
    Object.values(inputs).forEach(setFill);
    $('o-once').textContent = fmt(P) + ' Kč';
    $('o-month').textContent = fmt(M) + ' Kč';
    $('o-years').textContent = Y + ' ' + yearsWord(Y);
    $('o-rate').textContent = String(R).replace('.', ',') + ' %';
    $('ax-end').textContent = 'za ' + Y + ' ' + yearsWord(Y);

    const pts = series(P, M, Y, R);
    const last = pts[pts.length - 1];
    const max = last.v * 1.04 || 1;
    const dTotal = path(pts, 'v', max);
    $('ch-total').setAttribute('d', dTotal);
    $('ch-in').setAttribute('d', path(pts, 'inv', max));
    $('ch-area').setAttribute('d', dTotal + ' L600 240 L0 240 Z');

    const target = { total: last.v, inv: last.inv, gain: Math.max(0, last.v - last.inv) };
    if (hasGsap && animate && !reduce) {
      gsap.to(shown, { ...target, duration: animate === 'slow' ? 2 : 0.6, ease: 'power3.out', overwrite: true, onUpdate: renderNumbers });
    } else {
      Object.assign(shown, target); renderNumbers();
    }
  };
  Object.values(inputs).forEach(el => el.addEventListener('input', () => updateCalc(true)));

  /* ─── Sticky steps ─── */
  const steps = document.querySelectorAll('.step');
  const imgs = document.querySelectorAll('.start-frame .sm');
  const stNum = $('st-num');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const i = e.target.dataset.step;
      imgs.forEach(im => im.classList.toggle('is-active', im.dataset.step === i));
      stNum.textContent = '0' + (+i + 1);
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(s => io.observe(s));

  /* ─── Counters (plain) ─── */
  const runCounters = () => {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count;
      if (!hasGsap || reduce) { el.textContent = fmt(target); return; }
      const o = { v: 0 };
      gsap.to(o, {
        v: target, duration: 2, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
        onUpdate: () => { el.textContent = fmt(o.v); }
      });
    });
  };

  /* ─── Magnetic buttons ─── */
  if (fine) {
    document.querySelectorAll('.btn-magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transition = 'background .35s, color .35s, box-shadow .35s';
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.2}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transition = 'transform .5s cubic-bezier(0.22,0.61,0.36,1), background .35s, color .35s, box-shadow .35s';
        btn.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ─── Without GSAP: show everything, done ─── */
  if (!hasGsap || reduce) {
    updateCalc(false);
    runCounters();
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ─── Lenis ─── */
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const t = id === '#top' ? 0 : document.querySelector(id);
        if (t === null) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: id === '#top' ? 0 : -70, duration: 1.4 });
      });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ─── Scroll progress ─── */
  gsap.to('.scroll-progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });

  /* ─── Hero intro ─── */
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.from('.hero-img', { clipPath: 'inset(100% 0 0 0 round 220px 220px 4px 4px)', duration: 1.5, ease: 'power4.inOut' }, 0)
    .from('.hero-photo', { scale: 1.25, duration: 2.2, ease: 'power3.out' }, 0)
    .from('.hero-frame', { opacity: 0, x: -20, y: -20, duration: 1.4 }, 0.6)
    .from('.hero-title .w > span', { yPercent: 110, duration: 1.1, stagger: 0.07 }, 0.25)
    .from('.hero-fade', { y: 24, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out' }, 0.75)
    .from('.hero-badge', { y: 30, opacity: 0, duration: 1, ease: 'power3.out' }, 1.1)
    .from('.nav-inner', { y: -20, opacity: 0, duration: 1, ease: 'power3.out' }, 0.4);

  /* Hero parallax */
  gsap.to('.hero-photo', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
  gsap.to('.hero-copy', { y: -60, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '40% top', end: 'bottom top', scrub: 1 } });

  /* ─── Reveals ─── */
  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  gsap.utils.toArray('.reveal-group').forEach(g => {
    gsap.from(g.querySelectorAll('.reveal-item'), { y: 40, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: g, start: 'top 85%' } });
  });

  /* Clip reveal */
  gsap.utils.toArray('.clip-reveal').forEach(el => {
    gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'power4.inOut', scrollTrigger: { trigger: el, start: 'top 82%' } });
  });

  /* Parallax images */
  gsap.utils.toArray('.parallax-img').forEach(img => {
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('section'), start: 'top bottom', end: 'bottom top', scrub: 1 } });
  });

  /* CTA deco text drift */
  gsap.fromTo('.cta-deco', { xPercent: 8 }, { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: 1 } });

  /* Calculator: count up the first time it comes into view */
  updateCalc(false);
  const firstTotal = shown.total, firstInv = shown.inv, firstGain = shown.gain;
  Object.assign(shown, { total: 0, inv: 0, gain: 0 }); renderNumbers();
  ScrollTrigger.create({
    trigger: '.calc-result', start: 'top 80%', once: true,
    onEnter: () => {
      gsap.to(shown, { total: firstTotal, inv: firstInv, gain: firstGain, duration: 2, ease: 'power2.out', onUpdate: renderNumbers });
      const len = $('ch-total').getTotalLength();
      gsap.fromTo('#ch-total', { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut', onComplete: () => gsap.set('#ch-total', { clearProps: 'strokeDasharray,strokeDashoffset' }) });
      gsap.from('#ch-area', { opacity: 0, duration: 1.6, delay: 0.6 });
    }
  });

  runCounters();
  window.addEventListener('load', () => ScrollTrigger.refresh());
});
