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
     Testimonials carousel
  --------------------------------------------------------- */
  const testiSlides = document.getElementById('testiSlides');
  const testiNavWrap = document.getElementById('testiNav');
  const prevBtn = document.getElementById('testiPrev');
  const nextBtn = document.getElementById('testiNext');

  if (testiSlides) {
    const slides = testiSlides.querySelectorAll('.testi-slide');
    let current = 0;
    let autoplayTimer;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'testi-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', `Avis ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      testiNavWrap.appendChild(dot);
    });
    const dots = testiNavWrap.querySelectorAll('.testi-dot');

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      testiSlides.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    }

    function nextSlide() { goTo(current + 1); }
    function prevSlide() { goTo(current - 1); }

    nextBtn.addEventListener('click', () => { nextSlide(); restartAutoplay(); });
    prevBtn.addEventListener('click', () => { prevSlide(); restartAutoplay(); });

    function restartAutoplay() {
      clearInterval(autoplayTimer);
      if (!prefersReducedMotion) {
        autoplayTimer = setInterval(nextSlide, 6000);
      }
    }
    restartAutoplay();

    // Swipe support
    let touchStartX = 0;
    testiSlides.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    testiSlides.addEventListener('touchend', (e) => {
      const delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 40) {
        delta < 0 ? nextSlide() : prevSlide();
        restartAutoplay();
      }
    }, { passive: true });
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
