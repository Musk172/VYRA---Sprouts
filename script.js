document.addEventListener('DOMContentLoaded', () => {

    // Desktop overlay logic
    const desktopOverlay = document.getElementById('desktopOverlay');
    const closeOverlayBtn = document.getElementById('closeOverlay');

    if (window.innerWidth > 768) {
        desktopOverlay.style.display = 'flex';
        setTimeout(() => {
            desktopOverlay.style.opacity = '1';
        }, 100);
    }

    closeOverlayBtn.addEventListener('click', () => {
        desktopOverlay.style.opacity = '0';
        setTimeout(() => {
            desktopOverlay.style.display = 'none';
        }, 400);
    });

    // 1. Landing Overlay Animations
    const landingOverlay = document.getElementById('landingOverlay');
    const exploreBtn = document.getElementById('exploreBtn');

    // Page window opening from the middle animation (gorgeous outward expanding reveal)
    gsap.fromTo(landingOverlay,
        { 
            clipPath: 'inset(45% 45% 45% 45% round 30px)',
            opacity: 0
        },
        { 
            clipPath: 'inset(0% 0% 0% 0% round 0px)',
            opacity: 1,
            duration: 1.4, 
            ease: "power4.inOut",
            delay: 0.2
        }
    );


    // 2. Main App Animation (Intersection Observer for Swipe Cards)
    const cards = document.querySelectorAll('.swipe-card');
    let doorsOpened = false;

    // Hide all elements initially to prevent flashes
    cards.forEach(card => {
        gsap.set(card.querySelector('.card-bg'), { opacity: 0 });
        gsap.set(card.querySelector('.main-title'), { opacity: 0 });
        gsap.set(card.querySelector('.subtitle'), { opacity: 0 });
        gsap.set(card.querySelector('.circular-calorie-badge'), { opacity: 0 });
        gsap.set(card.querySelectorAll('.nutrition-glass-card, .order-cta-container'), { opacity: 0 });
    });

    function animateCard(card) {
        const bg = card.querySelector('.card-bg');
        const title = card.querySelector('.main-title');
        const subtitle = card.querySelector('.subtitle');
        const badge = card.querySelector('.circular-calorie-badge');
        const glassElements = card.querySelectorAll('.nutrition-glass-card, .order-cta-container');

        const cardTl = gsap.timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => card.classList.add('scroll-ready')
        });

        cardTl.fromTo(bg,
            { scale: 1.1, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1.5, ease: "power2.out" }
        )
            .fromTo(title,
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" },
                "-=0.8"
            )
            .fromTo(subtitle,
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" },
                "-=0.6"
            )
            .fromTo(badge,
                { opacity: 0, scale: 0.5, rotation: 15 },
                { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2)" },
                "-=0.6"
            )
            .fromTo(glassElements,
                { opacity: 0, y: 30, filter: "blur(10px)" },
                { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power2.out", stagger: 0.12 },
                "-=0.6"
            );
    }

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && doorsOpened) {
                if (!entry.target.classList.contains('animated')) {
                    entry.target.classList.add('animated');
                    animateCard(entry.target);
                }
            }
        });
    }, { threshold: 0.5 });

    cards.forEach(card => cardObserver.observe(card));

    // Advanced Scroll Parallax & Scale Effect
    const swipeContainer = document.querySelector('.swipe-container');
    swipeContainer.addEventListener('scroll', () => {
        requestAnimationFrame(() => {
            const viewportHeight = window.innerHeight;
            cards.forEach(card => {
                // Only scrub animation if the GSAP entrance animation is complete
                if (card.classList.contains('scroll-ready')) {
                    const rect = card.getBoundingClientRect();
                    const normalized = rect.top / viewportHeight; // -1 to 1
                    const abs = Math.min(Math.abs(normalized), 1);

                    // Subtle scale down as card leaves center (1 down to 0.9)
                    const scale = 1 - (abs * 0.1);
                    // Dim slightly as it leaves center
                    const opacity = 1 - (abs * 0.6);

                    // Apply to inner layers
                    const bg = card.querySelector('.card-bg');
                    const grad = card.querySelector('.card-gradient');
                    const ui = card.querySelector('.card-ui');

                    if (bg && grad && ui) {
                        const transformStr = `scale(${scale})`;
                        bg.style.transform = transformStr;
                        grad.style.transform = transformStr;
                        ui.style.transform = transformStr;

                        bg.style.opacity = Math.max(opacity, 0);
                        ui.style.opacity = Math.max(opacity, 0);
                    }
                }
            });
        });
    });

    // Click handler for opening the menu (sliding split-door opening reveal)
    exploreBtn.addEventListener('click', () => {
        const doorTl = gsap.timeline({
            onComplete: () => {
                landingOverlay.style.display = 'none';
                doorsOpened = true;
                // Trigger animation for the first card specifically
                if (cards.length > 0) {
                    cards[0].classList.add('animated');
                    animateCard(cards[0]);
                }
            }
        });

        // Fade out the explore button quickly
        doorTl.to(exploreBtn, {
            opacity: 0,
            scale: 0.8,
            duration: 0.4,
            ease: "power2.out"
        });

        // Slide the split doors out to the sides simultaneously
        doorTl.to('.door-left', {
            x: "-100%",
            duration: 1.2,
            ease: "power4.inOut"
        }, "-=0.2");

        doorTl.to('.door-right', {
            x: "100%",
            duration: 1.2,
            ease: "power4.inOut"
        }, "-=1.2");
    });


    // 3. Cart Logic (pure CSS class-toggle — guaranteed to work on all mobile browsers)
    const cartToast = document.getElementById('cart-toast');
    const toastImg = cartToast.querySelector('.toast-img');
    const toastTitle = cartToast.querySelector('.toast-title');
    let toastTimeout;

    let cartItems = [];
    const cartPage = document.getElementById('cart-page');
    const cartBackdrop = document.getElementById('cart-backdrop');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartEmptyState = document.getElementById('cartEmptyState');
    const confirmOrderBtn = document.getElementById('confirmOrderBtn');

    function openCart() {
        cartPage.classList.add('open');
        cartBackdrop.classList.add('open');
    }

    function closeCart() {
        cartPage.classList.remove('open');
        cartBackdrop.classList.remove('open');
    }

    // Helper: get clean title from an element that may contain <br> tags
    function getCleanTitle(el) {
        if (!el) return 'Bowl';
        const clone = el.cloneNode(true);
        clone.querySelectorAll('br').forEach(br => br.replaceWith(' '));
        return clone.textContent.replace(/\s+/g, ' ').trim();
    }

    function renderCart() {
        document.querySelectorAll('.cart-item').forEach(el => el.remove());
        if (cartItems.length === 0) {
            cartEmptyState.style.display = 'flex';
            confirmOrderBtn.disabled = true;
            confirmOrderBtn.textContent = 'Confirm Order';
        } else {
            cartEmptyState.style.display = 'none';
            confirmOrderBtn.disabled = false;
            confirmOrderBtn.textContent = 'Confirm Order';
            cartItems.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div class="cart-item-img" style="background-image:url('${item.image}');"></div>
                    <div class="cart-item-details">
                        <span class="cart-item-title">${item.title}</span>
                    </div>
                    <div class="qty-stepper">
                        <button class="qty-btn qty-minus" data-index="${index}">−</button>
                        <span class="qty-count">${item.qty}</span>
                        <button class="qty-btn qty-plus" data-index="${index}">+</button>
                    </div>`;
                cartItemsContainer.insertBefore(div, cartEmptyState);
            });
        }
        
        // Update all cart badges
        const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);
        document.querySelectorAll('.cart-badge').forEach(badge => {
            if (totalItems > 0) {
                badge.textContent = totalItems;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    // Single document-level click handler covers all buttons
    document.addEventListener('click', function (e) {
        if (e.target.closest('.go-to-cart-btn')) {
            openCart();
            return;
        }

        // Quantity decrease
        if (e.target.closest('.qty-minus')) {
            const idx = parseInt(e.target.closest('.qty-minus').dataset.index);
            if (cartItems[idx].qty > 1) {
                cartItems[idx].qty--;
            } else {
                cartItems.splice(idx, 1);
            }
            renderCart();
            return;
        }

        // Quantity increase
        if (e.target.closest('.qty-plus')) {
            const idx = parseInt(e.target.closest('.qty-plus').dataset.index);
            cartItems[idx].qty++;
            renderCart();
            return;
        }

        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn) {
            const card = addBtn.closest('.swipe-card');
            if (!card) return;
            const bgEl = card.querySelector('.card-bg');
            let bgUrl = '';
            if (bgEl) {
                const bg = window.getComputedStyle(bgEl).backgroundImage;
                if (bg && bg !== 'none') bgUrl = bg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
            }
            const titleText = getCleanTitle(card.querySelector('.main-title'));

            // If item already in cart, increment qty
            const existing = cartItems.find(i => i.title === titleText);
            if (existing) {
                existing.qty++;
            } else {
                cartItems.push({ image: bgUrl, title: titleText, qty: 1 });
            }
            renderCart();

            // Button click animation
            addBtn.classList.add('added');
            const btnText = addBtn.querySelector('span');
            const oldText = btnText.textContent;
            btnText.textContent = 'Added!';
            setTimeout(() => {
                addBtn.classList.remove('added');
                btnText.textContent = oldText;
            }, 1500);

            toastImg.style.backgroundImage = `url('${bgUrl}')`;
            toastTitle.textContent = titleText;
            clearTimeout(toastTimeout);
            gsap.killTweensOf(cartToast);
            gsap.set(cartToast, { pointerEvents: 'auto' });
            gsap.fromTo(cartToast,
                { y: -100, xPercent: -50, autoAlpha: 0 },
                { y: 0, xPercent: -50, autoAlpha: 1, duration: 0.6, ease: 'back.out(1.5)' }
            );
            toastTimeout = setTimeout(() => {
                gsap.to(cartToast, {
                    y: -100, autoAlpha: 0, duration: 0.4, ease: 'power2.in',
                    onComplete: () => gsap.set(cartToast, { pointerEvents: 'none' })
                });
            }, 3000);
        }
    });

    closeCartBtn.addEventListener('click', closeCart);
    cartBackdrop.addEventListener('click', closeCart);

    confirmOrderBtn.addEventListener('click', () => {
        if (cartItems.length === 0) return;
        confirmOrderBtn.textContent = 'Order Placed! ✓';
        confirmOrderBtn.style.background = '#3a6646';
        setTimeout(() => {
            cartItems = [];
            renderCart();
            confirmOrderBtn.style.background = '';
            closeCart();
        }, 1500);
    });
});
