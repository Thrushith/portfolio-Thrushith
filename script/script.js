// Respect people who've asked their system for less motion
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mobile menu
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');

navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
    });
});

// Border under the top bar once you scroll
const topbar = document.querySelector('.topbar');
const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Fade sections in as they enter the viewport
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Highlight the nav link for the section on screen
const navLinks = [...nav.querySelectorAll('a')];
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
        });
    });
}, { rootMargin: '-45% 0px -50% 0px' });

document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));

// Contact form: send in the background and answer inside the terminal box,
// so nobody lands on FormSubmit's generic page.
const form = document.getElementById('contactForm');
const formStatus = form.querySelector('.form-status');
const formDone = form.querySelector('.form-done');
const formFields = [...form.children].filter(el => !el.matches('.terminal-bar, .form-done, input[type="hidden"], .hp'));

// If JS is on but the background send fails, the normal submit still lands on our own thanks page
form.querySelector('input[name="_next"]').value = location.origin + '/thanks.html';

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.classList.contains('sending')) return;

    form.classList.add('sending');
    formStatus.classList.remove('error');
    formStatus.textContent = '> sending...';

    try {
        const res = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: new FormData(form)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || String(data.success) !== 'true') throw new Error(data.message || 'send failed');

        form.reset();
        formStatus.textContent = '';
        formFields.forEach(el => { el.hidden = true; });
        formDone.hidden = false;
        formDone.querySelector('#sendAnother').focus();
    } catch (err) {
        formStatus.classList.add('error');
        formStatus.textContent = "> couldn't send that. Try again, or email me directly at thrushithy@gmail.com";
    } finally {
        form.classList.remove('sending');
    }
});

document.getElementById('sendAnother').addEventListener('click', () => {
    formDone.hidden = true;
    formFields.forEach(el => { el.hidden = false; });
    form.querySelector('input[name="email"]').focus();
});

// Social buttons drift toward the cursor a little ("magnetic")
if (!reduceMotion) {
    document.querySelectorAll('.magnetic').forEach(el => {
        el.addEventListener('mousemove', e => {
            const r = el.getBoundingClientRect();
            const x = e.clientX - (r.left + r.width / 2);
            const y = e.clientY - (r.top + r.height / 2);
            el.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    });
}

// Contact cards tilt toward the cursor (or finger) with a brand-colored glow
document.querySelectorAll('.social-card').forEach(card => {
    const tilt = (cx, cy) => {
        const r = card.getBoundingClientRect();
        const x = Math.min(Math.max((cx - r.left) / r.width, 0), 1);
        const y = Math.min(Math.max((cy - r.top) / r.height, 0), 1);
        card.style.setProperty('--mx', x * 100 + '%');
        card.style.setProperty('--my', y * 100 + '%');
        if (!reduceMotion) {
            card.style.setProperty('--ry', (x - 0.5) * 10 + 'deg');
            card.style.setProperty('--rx', (0.5 - y) * 14 + 'deg');
        }
    };
    const untilt = () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
    };
    card.addEventListener('mousemove', e => tilt(e.clientX, e.clientY));
    card.addEventListener('mouseleave', untilt);
    card.addEventListener('touchmove', e => tilt(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    card.addEventListener('touchend', untilt);
});

// Side rail shows up after the hero and steps aside once the contact cards are on screen
const rail = document.querySelector('.social-rail');
const heroSection = document.querySelector('.hero');
const contactCards = document.querySelector('.social-cards');
const updateRail = () => {
    const pastHero = heroSection.getBoundingClientRect().bottom < window.innerHeight * 0.35;
    const cardsInView = contactCards.getBoundingClientRect().top < window.innerHeight;
    rail.classList.toggle('show', pastHero && !cardsInView);
};
window.addEventListener('scroll', updateRail, { passive: true });
window.addEventListener('resize', updateRail);
updateRail();

// Live GitHub numbers on the card; if the API is unavailable the handle just stays as is
fetch('https://api.github.com/users/Thrushith')
    .then(res => (res.ok ? res.json() : Promise.reject()))
    .then(user => {
        const repos = user.public_repos;
        const followers = user.followers;
        document.getElementById('ghStats').textContent =
            `@Thrushith · ${repos} repo${repos === 1 ? '' : 's'} · ${followers} follower${followers === 1 ? '' : 's'}`;
    })
    .catch(() => {});

// Hide the scroll hints once someone has started scrolling
const markScrolled = () => document.body.classList.toggle('has-scrolled', window.scrollY > 60);
window.addEventListener('scroll', markScrolled, { passive: true });
markScrolled();

// Keep the footer year current
document.getElementById('year').textContent = new Date().getFullYear();


// Toolkit tiles: tilt toward the cursor and print a note in the readout
const readout = document.getElementById('readout');
const readoutIdle = readout.textContent;
let typing;

function typeOut(text) {
    clearInterval(typing);
    readout.classList.toggle('lit', text !== readoutIdle);
    if (reduceMotion) {
        readout.textContent = text;
        return;
    }
    let i = 0;
    readout.textContent = '';
    typing = setInterval(() => {
        readout.textContent = text.slice(0, ++i);
        if (i >= text.length) clearInterval(typing);
    }, 14);
}

document.querySelectorAll('.tile').forEach(tile => {
    const show = () => typeOut(tile.dataset.note);

    tile.addEventListener('mouseenter', show);
    tile.addEventListener('focus', show);

    const tilt = (clientX, clientY) => {
        const r = tile.getBoundingClientRect();
        const x = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
        const y = Math.min(Math.max((clientY - r.top) / r.height, 0), 1);
        tile.style.setProperty('--mx', x * 100 + '%');
        tile.style.setProperty('--my', y * 100 + '%');
        if (!reduceMotion) {
            tile.style.setProperty('--ry', (x - 0.5) * 22 + 'deg');
            tile.style.setProperty('--rx', (0.5 - y) * 22 + 'deg');
        }
    };
    const untilt = () => {
        tile.style.setProperty('--rx', '0deg');
        tile.style.setProperty('--ry', '0deg');
    };

    tile.addEventListener('mousemove', e => tilt(e.clientX, e.clientY));
    tile.addEventListener('mouseleave', untilt);

    // On phones the tile leans toward your finger while you press it
    tile.addEventListener('touchstart', e => tilt(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    tile.addEventListener('touchmove', e => tilt(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    tile.addEventListener('touchend', untilt);
    tile.addEventListener('touchcancel', untilt);

    tile.addEventListener('click', () => {
        document.querySelectorAll('.tile.on').forEach(t => t !== tile && t.classList.remove('on'));
        tile.classList.toggle('on');
        tile.classList.remove('pop');
        void tile.offsetWidth; // restart the animation
        tile.classList.add('pop');
        show();
    });
});

document.querySelector('.stack').addEventListener('mouseleave', () => {
    if (!document.querySelector('.tile.on')) typeOut(readoutIdle);
});

// Letters part around the cursor, on every bit of text on the page.
// Text is split into word spans (so lines still wrap normally) holding one span per letter.
const SKIP = 'script, style, textarea, input, select, option, .readout, .grain, svg';

function splitText(root) {
    // Links and buttons take their accessible name from their text, so pin it down first
    root.querySelectorAll('a, button').forEach(el => {
        const label = el.textContent.replace(/\s+/g, ' ').trim();
        if (label && !el.hasAttribute('aria-label')) el.setAttribute('aria-label', label);
    });

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: node => node.textContent.trim() && !node.parentElement.closest(SKIP)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    const groups = [];
    nodes.forEach(node => {
        const chars = [];
        const frag = document.createDocumentFragment();
        node.textContent.replace(/\s+/g, ' ').split(/( )/).forEach(part => {
            if (!part) return;
            if (part === ' ') {
                frag.appendChild(document.createTextNode(' '));
                return;
            }
            const word = document.createElement('span');
            word.className = 'spread-w';
            for (const ch of part) {
                const c = document.createElement('span');
                c.className = 'spread-ch';
                c.textContent = ch;
                word.appendChild(c);
                chars.push(c);
            }
            frag.appendChild(word);
        });
        const host = node.parentElement;
        node.replaceWith(frag);
        groups.push({ host, chars });
    });
    return groups;
}

if (!reduceMotion) {
    const groups = splitText(document.body);
    const header = document.querySelector('.topbar');
    let points = [];      // sorted by y so we only look at letters near the cursor
    let active = new Set();
    let mouse = null;
    let frame = null;

    // Sums offsets up the tree, which ignores transforms, so hover lifts and
    // scroll reveals don't throw the positions off.
    const pagePos = el => {
        let x = 0, y = 0;
        for (let n = el; n; n = n.offsetParent) {
            x += n.offsetLeft;
            y += n.offsetTop;
        }
        return { x, y };
    };

    const measure = () => {
        points = [];
        groups.forEach(({ host, chars }) => {
            if (!host.isConnected || !host.offsetParent && getComputedStyle(host).position !== 'fixed') return;
            const size = parseFloat(getComputedStyle(host).fontSize);
            const push = Math.min(size * 0.5, 22);
            const radius = Math.max(110, size * 2.4);
            // letters in the sticky header move with the viewport, not the page
            const fixed = header.contains(host);
            chars.forEach(c => {
                const w = c.offsetWidth;
                if (!w) return;
                const pos = fixed ? c.getBoundingClientRect() : pagePos(c);
                points.push({
                    el: c,
                    x: (fixed ? pos.left : pos.x) + w / 2,
                    y: (fixed ? pos.top : pos.y) + c.offsetHeight / 2,
                    h: c.offsetHeight,
                    fixed, push, radius
                });
            });
        });
        points.sort((a, b) => a.y - b.y);
    };

    const firstAtOrBelow = y => {
        let lo = 0, hi = points.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (points[mid].y < y) lo = mid + 1; else hi = mid;
        }
        return lo;
    };

    // A fingertip hides what's under it, so touch gets a wider, stronger push
    // and letters also lift up out from under the finger.
    let touching = false;

    const affect = (p, mx, my, next) => {
        const dx = p.x - mx;
        const radius = touching ? p.radius * 1.7 : p.radius;
        const reach = 1 - Math.abs(dx) / radius;
        const sameLine = 1 - Math.abs(p.y - my) / (p.h * (touching ? 2.6 : 1.4));
        if (reach <= 0 || sameLine <= 0) return;
        const w = reach * reach * sameLine;
        const push = touching ? p.push * 1.6 : p.push;
        const lift = touching ? -p.h * 0.45 * w : 0;
        p.el.style.transform = `translate(${Math.sign(dx) * push * w}px, ${lift}px)`;
        p.el.style.color = w > 0.35 ? 'var(--accent)' : '';
        next.add(p.el);
    };

    const render = () => {
        frame = null;
        const next = new Set();
        if (mouse) {
            const pageX = mouse.x + window.scrollX;
            const pageY = mouse.y + window.scrollY;
            const band = 260;
            for (let i = firstAtOrBelow(pageY - band); i < points.length && points[i].y < pageY + band; i++) {
                if (!points[i].fixed) affect(points[i], pageX, pageY, next);
            }
            if (mouse.y < header.offsetHeight + 20) {
                points.forEach(p => p.fixed && affect(p, mouse.x, mouse.y, next));
            }
        }
        active.forEach(c => {
            if (!next.has(c)) {
                c.style.transform = '';
                c.style.color = '';
            }
        });
        active = next;
    };

    const queue = () => {
        if (!frame) frame = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', e => {
        // phones fire a fake mousemove after a tap; ignore it while a finger is down
        if (touching) return;
        mouse = { x: e.clientX, y: e.clientY };
        queue();
    }, { passive: true });
    window.addEventListener('scroll', queue, { passive: true });
    document.addEventListener('mouseleave', () => {
        mouse = null;
        queue();
    });

    // Touch: letters part around your finger as you tap or drag, and settle
    // back shortly after you let go. Listeners are passive so scrolling is untouched.
    let releaseTimer;
    const onTouch = e => {
        const t = e.touches[0];
        if (!t) return;
        clearTimeout(releaseTimer);
        touching = true;
        mouse = { x: t.clientX, y: t.clientY };
        queue();
    };
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    const release = () => {
        clearTimeout(releaseTimer);
        releaseTimer = setTimeout(() => {
            mouse = null;
            touching = false;
            queue();
        }, 450);
    };
    window.addEventListener('touchend', release, { passive: true });
    window.addEventListener('touchcancel', release, { passive: true });

    // Re-measure whenever the layout can shift: resize, fonts and images loading
    let measureTimer;
    const remeasure = () => {
        clearTimeout(measureTimer);
        measureTimer = setTimeout(() => {
            measure();
            queue();
        }, 120);
    };
    new ResizeObserver(remeasure).observe(document.body);
    document.fonts.ready.then(remeasure);
    window.addEventListener('load', remeasure);
    measure();
}
