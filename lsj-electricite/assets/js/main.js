(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Header: shrink + blur on scroll
  --------------------------------------------------------- */
  const header = document.getElementById('siteHeader');
  const onScrollHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------------------------------------------------------
     Mobile menu
  --------------------------------------------------------- */
  const burger = document.getElementById('burgerBtn');
  const mobileNav = document.getElementById('mobileNav');

  const closeMobileNav = () => {
    burger.classList.remove('is-active');
    mobileNav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  burger.addEventListener('click', () => {
    const willOpen = !mobileNav.classList.contains('is-open');
    burger.classList.toggle('is-active', willOpen);
    mobileNav.classList.toggle('is-open', willOpen);
    burger.setAttribute('aria-expanded', String(willOpen));
    document.body.style.overflow = willOpen ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  /* ---------------------------------------------------------
     Scroll reveal (IntersectionObserver)
  --------------------------------------------------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------------------------------------------
     Animated counters
  --------------------------------------------------------- */
  const counters = document.querySelectorAll('.count-up');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (prefersReducedMotion) {
      el.textContent = target;
      return;
    }
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => countObserver.observe(el));
  } else {
    counters.forEach((el) => (el.textContent = el.dataset.count));
  }

  /* ---------------------------------------------------------
     Portfolio filters
  --------------------------------------------------------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const filter = btn.dataset.filter;

      portfolioItems.forEach((item) => {
        const match = filter === 'all' || item.dataset.cat === filter;
        item.style.display = match ? '' : 'none';
      });
    });
  });

  /* ---------------------------------------------------------
     Hero energy orb (animated electric plasma ball)
  --------------------------------------------------------- */
  const orbCanvas = document.getElementById('energyOrb');
  if (orbCanvas) {
    const ctx = orbCanvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h, cx, cy, radius;
    let running = false;
    let rafId = null;
    let t = 0;

    const arcs = Array.from({ length: 7 }, (_, i) => ({
      angle: (i / 7) * Math.PI * 2,
      seed: Math.random() * 1000,
    }));

    function resize() {
      const rect = orbCanvas.getBoundingClientRect();
      if (rect.width === 0) return;
      orbCanvas.width = rect.width * dpr;
      orbCanvas.height = rect.height * dpr;
      w = orbCanvas.width;
      h = orbCanvas.height;
      cx = w / 2;
      cy = h / 2;
      radius = Math.min(w, h) * 0.46;
    }

    // Jagged lightning tendril via recursive midpoint displacement
    function buildArc(x1, y1, x2, y2, depth, offset, points) {
      if (depth <= 0) {
        points.push([x2, y2]);
        return;
      }
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist;
      const ny = dx / dist;
      const disp = (Math.random() - 0.5) * offset;
      const mx2 = mx + nx * disp;
      const my2 = my + ny * disp;
      buildArc(x1, y1, mx2, my2, depth - 1, offset * 0.55, points);
      buildArc(mx2, my2, x2, y2, depth - 1, offset * 0.55, points);
    }

    function drawFrame() {
      ctx.clearRect(0, 0, w, h);

      // Slow orbital drift — the ball itself moves within its housing
      const ox = cx + Math.sin(t * 0.6) * radius * 0.14;
      const oy = cy + Math.cos(t * 0.45) * radius * 0.1;

      // Pulsing core
      const pulse = 1 + Math.sin(t * 2.2) * 0.06;
      const coreR = radius * 0.4 * pulse;

      // Outer glow halo
      const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius * 1.1);
      glow.addColorStop(0, 'rgba(255,207,92,0.5)');
      glow.addColorStop(0.45, 'rgba(255,183,0,0.18)');
      glow.addColorStop(1, 'rgba(255,183,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ox, oy, radius * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Crackling electric arcs, slowly rotating around the core
      ctx.lineCap = 'round';
      arcs.forEach((arc, i) => {
        const ang = arc.angle + t * 0.22 + Math.sin(t * 0.5 + arc.seed) * 0.15;
        const x1 = ox + Math.cos(ang) * coreR * 0.6;
        const y1 = oy + Math.sin(ang) * coreR * 0.6;
        const x2 = ox + Math.cos(ang) * radius * 0.95;
        const y2 = oy + Math.sin(ang) * radius * 0.95;
        const pts = [];
        buildArc(x1, y1, x2, y2, 4, radius * 0.16, pts);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        pts.forEach((p) => ctx.lineTo(p[0], p[1]));
        const alpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 3 + arc.seed));
        const isAmber = i % 2 === 0;
        ctx.strokeStyle = isAmber ? `rgba(255,207,92,${alpha})` : `rgba(92,225,255,${alpha * 0.85})`;
        ctx.lineWidth = 1.5 * dpr;
        ctx.shadowBlur = 10 * dpr;
        ctx.shadowColor = isAmber ? '#ffcf5c' : '#5ce1ff';
        ctx.stroke();
      });

      // Glowing core sphere
      const coreGrad = ctx.createRadialGradient(
        ox - coreR * 0.3, oy - coreR * 0.3, coreR * 0.1,
        ox, oy, coreR
      );
      coreGrad.addColorStop(0, '#fff8e6');
      coreGrad.addColorStop(0.45, '#ffcf5c');
      coreGrad.addColorStop(1, '#ff8a00');
      ctx.shadowBlur = 22 * dpr;
      ctx.shadowColor = '#ffb700';
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(ox, oy, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Orbiting sparks
      for (let i = 0; i < 5; i++) {
        const sAng = t * (0.8 + i * 0.15) + i * ((Math.PI * 2) / 5);
        const sR = radius * (0.72 + 0.14 * Math.sin(t * 1.3 + i));
        const sx = ox + Math.cos(sAng) * sR;
        const sy = oy + Math.sin(sAng) * sR;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.shadowBlur = 7 * dpr;
        ctx.shadowColor = '#fff';
        ctx.arc(sx, sy, 1.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function loop() {
      if (!running) return;
      t += 0.016;
      drawFrame();
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      resize();
      if (prefersReducedMotion) {
        drawFrame();
      } else {
        rafId = requestAnimationFrame(loop);
      }
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    window.addEventListener('resize', () => {
      const wasRunning = running;
      resize();
      if (wasRunning && prefersReducedMotion) drawFrame();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (orbVisible) start();
    });

    let orbVisible = false;
    if ('IntersectionObserver' in window) {
      const orbObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            orbVisible = entry.isIntersecting;
            if (orbVisible && !document.hidden) start();
            else stop();
          });
        },
        { threshold: 0.1 }
      );
      orbObserver.observe(orbCanvas);
    } else {
      orbVisible = true;
      start();
    }
  }

  /* ---------------------------------------------------------
     FAQ accordion
  --------------------------------------------------------- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-q');
    const answer = item.querySelector('.faq-a');

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      document.querySelectorAll('.faq-item.is-open').forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.faq-a').style.maxHeight = null;
        }
      });

      item.classList.toggle('is-open', !isOpen);
      answer.style.maxHeight = !isOpen ? `${answer.scrollHeight}px` : null;
    });
  });

  /* ---------------------------------------------------------
     Contact form (client-side demo submission)
  --------------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Envoi en cours…';

      // NOTE: no backend wired up yet — this simulates a submission.
      // Replace with a real endpoint (e.g. Formspree, EmailJS, or a custom API route) to receive messages.
      setTimeout(() => {
        contactForm.style.display = 'none';
        formSuccess.classList.add('is-visible');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }, 900);
    });
  }

  /* ---------------------------------------------------------
     Floating back-to-top button
  --------------------------------------------------------- */
  const fabTop = document.getElementById('fabTop');
  window.addEventListener('scroll', () => {
    fabTop.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });

  fabTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* ---------------------------------------------------------
     Hero parallax on mouse move (desktop / fine pointer only)
  --------------------------------------------------------- */
  const heroPanel = document.querySelector('.hero-panel');
  const hero = document.querySelector('.hero');
  if (heroPanel && hero && window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    hero.addEventListener('mousemove', (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 16;
      const y = (e.clientY / innerHeight - 0.5) * 16;
      heroPanel.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
    });
    hero.addEventListener('mouseleave', () => {
      heroPanel.style.transform = '';
    });
  }

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Smooth-close mobile nav on resize past breakpoint
  --------------------------------------------------------- */
  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) closeMobileNav();
  });
})();
