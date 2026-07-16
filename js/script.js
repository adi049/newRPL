// ============ MOBILE VIEWPORT HEIGHT FIX ============
// Mobile browsers change the visible viewport height when the address bar
// shows/hides on scroll. `.hero{ min-height:100vh }` reacts to that and
// causes the whole layout (including the fixed navbar) to jump/reflow,
// which is why the navbar can appear to "disappear" on real phones even
// though it looks fine on desktop / devtools device emulation.
// We set a stable --vh custom property instead and only recompute it on
// real size changes (orientation change / actual resize), not on every
// address-bar show/hide.
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setVH();

// ============ FOOTER YEAR ============
const year = document.getElementById("year");
if (year) {
  year.textContent = new Date().getFullYear();
}

// ============ LENIS SMOOTH SCROLL ============
let lenis;
if (window.Lenis) {
  lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    smoothTouch: false, // keep native touch scrolling on mobile (prevents jank/blocked taps on fixed elements like the navbar)
    easing: (t) => 1 - Math.pow(1 - t, 3)
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  if (window.gsap && window.ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
}

// ============ SINGLE, DEBOUNCED RESIZE HANDLER ============
// FIX: previously both a `resize` listener AND a whole-`document.body`
// ResizeObserver called lenis.resize()/ScrollTrigger.refresh(). On mobile,
// scrolling itself changes body height (address bar collapsing), so the
// ResizeObserver kept re-firing this in a loop -> constant layout
// recalculation -> visible flicker/jump around the fixed navbar.
// Now we only recalc on real resize / orientation change, debounced,
// and we also refresh --vh so 100vh-based sections don't jump.
let resizeTimer;
function handleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    setVH();
    if (lenis) lenis.resize();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }, 150);
}
window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleResize);

// anchor links respect lenis
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -90 });
        else target.scrollIntoView({ behavior: 'smooth' });
        closeDrawer();
      }
    }
  });
});

// ============ NAVBAR SCROLLED STATE ============
const nav = document.getElementById('siteNav');
const onScroll = () => {
  if (window.scrollY > 40) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ============ MOBILE DRAWER ============
const burger = document.getElementById("burgerBtn");
const drawer = document.getElementById("mobileDrawer");
const drawerClose = document.getElementById("drawerCloseBtn");
const drawerOverlay = document.getElementById("drawerOverlay");

function openDrawer() {
  drawer.classList.add("open");
  drawerOverlay?.classList.add("open");
  burger.setAttribute("aria-expanded", "true");
  document.body.classList.add("drawer-open");
}
function closeDrawer() {
  if (!drawer) return;
  drawer.classList.remove("open");
  drawerOverlay?.classList.remove("open");
  burger?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("drawer-open");
}

burger?.addEventListener("click", openDrawer);
drawerClose?.addEventListener("click", closeDrawer);
drawerOverlay?.addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawer?.classList.contains("open")) closeDrawer();
});

// ============ SCROLL REVEAL ============
const revealEls = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in'), i * 60);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  revealEls.forEach(el => io.observe(el));

  // safety net — force-reveal any section still hidden after 4s
  setTimeout(() => {
    revealEls.forEach(el => el.classList.add('in'));
  }, 4000);
} else {
  revealEls.forEach(el => el.classList.add('in'));
}

// ============ COUNTER ANIMATION ============
const counters = document.querySelectorAll('.counter');
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      let cur = 0;
      const step = Math.max(1, Math.round(target / 40));
      const tick = () => {
        cur += step;
        if (cur >= target) { el.textContent = target; return; }
        el.textContent = cur;
        requestAnimationFrame(tick);
      };
      tick();
      counterIO.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => counterIO.observe(c));

// ============ SIDE STICKY CONTACT WIDGET ============
const sideContact = document.getElementById('sideContact');
const sideContactTab = document.getElementById('sideContactTab');
sideContactTab?.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = sideContact.classList.toggle('open');
  sideContactTab.setAttribute('aria-expanded', isOpen);
});
document.addEventListener('click', (e) => {
  if (sideContact && sideContact.classList.contains('open') && !sideContact.contains(e.target)) {
    sideContact.classList.remove('open');
    sideContactTab.setAttribute('aria-expanded', 'false');
  }
});
sideContact?.querySelectorAll('.side-contact__link, .side-contact__call').forEach(el => {
  el.addEventListener('click', () => {
    sideContact.classList.remove('open');
    sideContactTab.setAttribute('aria-expanded', 'false');
  });
});

// ============ BUTTON RIPPLE ============
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function () {
    this.classList.remove('rippling');
    void this.offsetWidth; // reflow to restart animation
    this.classList.add('rippling');
    setTimeout(() => this.classList.remove('rippling'), 500);
  });
});

// ============ GSAP HERO ENTRANCE + FLOAT CARDS ============
if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger);

  gsap.from('.hero__eyebrow, .hero__title, .hero__sub, .hero__actions, .hero__trust', {
    y: 24, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', delay: 0.15
  });

  gsap.utils.toArray('.float-card').forEach((card, i) => {
    gsap.from(card, { y: 40, opacity: 0, duration: 1, delay: 0.4 + i * 0.15, ease: 'power3.out' });
    gsap.to(card, {
      y: '+=12', duration: 2.4 + i * 0.3, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.2
    });
  });

  gsap.to('.hero__ring', { rotate: 360, duration: 40, repeat: -1, ease: 'none' });

  // Make sure ScrollTrigger measures the real, final layout once everything
  // (fonts/images) has settled — avoids stale trigger positions on mobile.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

// ============ WHATSAPP BOOKING FORM ============
const form = document.getElementById("bookingForm");
const note = document.getElementById("formNote");

form?.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("fname").value;
  const phone = document.getElementById("fphone").value;
  const packageName = document.getElementById("fpackage").value;
  const mode = document.getElementById("fmode").value;
  const message = document.getElementById("fmsg").value;

  const whatsappMessage =
`Hello RPL Diagnostic,

I would like to book an appointment.

👤 Name: ${name}
📞 Phone: ${phone}

🧪 Test/Package:
${packageName}

🏠 Preferred Mode:
${mode}

📝 Message:
${message}

Please confirm my appointment.`;

  const whatsappURL =
`https://wa.me/919811561712?text=${encodeURIComponent(whatsappMessage)}`;

  window.open(whatsappURL, "_blank");

  note.innerHTML = "Redirecting to WhatsApp...";
  note.style.color = "green";

  form.reset();
});