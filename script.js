const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const header = document.querySelector('.site-header');
const controllerCanvas = document.querySelector('#controller-canvas');
const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', String(isOpen));
    });
}

if (header) {
    window.addEventListener('scroll', () => {
        header.classList.toggle('is-scrolled', window.scrollY > 80);
    });
}

if (contactForm) {
    const submitButton = contactForm.querySelector('.submit-btn');
    const submitButtonLabel = submitButton.querySelector('span:first-child');
    const defaultButtonText = submitButtonLabel.textContent;
    const formEndpoint = contactForm.dataset.ajaxEndpoint || contactForm.getAttribute('action');
    const requestTimeout = 12000;

    const setStatus = (message, type = '') => {
        formStatus.textContent = message;
        formStatus.className = type ? `form-status ${type}` : 'form-status';
    };

    const resetSubmitButton = () => {
        submitButton.disabled = false;
        submitButtonLabel.textContent = defaultButtonText;
    };

    const showError = (field, message) => {
        const group = field.closest('.form-group');
        const errorText = group.querySelector('.error-message');

        group.classList.add('has-error');
        errorText.textContent = message;
    };

    const clearErrors = () => {
        contactForm.querySelectorAll('.form-group').forEach((group) => {
            group.classList.remove('has-error');
            group.querySelector('.error-message').textContent = '';
        });

        setStatus('');
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const buildMailtoLink = (name, email, message) => {
        const subject = encodeURIComponent('New Portfolio Contact Message');
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);

        return `mailto:danielehikowoicho03@gmail.com?subject=${subject}&body=${body}`;
    };

    contactForm.addEventListener('input', (event) => {
        const field = event.target;
        const group = field.closest('.form-group');

        if (group) {
            group.classList.remove('has-error');
            group.querySelector('.error-message').textContent = '';
        }

        if (formStatus.classList.contains('error')) {
            setStatus('');
        }
    });

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearErrors();

        const nameInput = contactForm.querySelector('#name');
        const emailInput = contactForm.querySelector('#email');
        const messageInput = contactForm.querySelector('#message');
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();
        let hasError = false;

        if (name.length < 2) {
            showError(nameInput, 'Please enter your name.');
            hasError = true;
        }

        if (!isValidEmail(email)) {
            showError(emailInput, 'Please enter a valid email address.');
            hasError = true;
        }

        if (message.length < 10) {
            showError(messageInput, 'Please write a message of at least 10 characters.');
            hasError = true;
        }

        if (hasError) {
            setStatus('Please fix the highlighted fields before sending.', 'error');
            return;
        }

        submitButton.disabled = true;
        submitButtonLabel.textContent = 'Sending...';
        setStatus('Sending your message securely...');

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), requestTimeout);

        try {
            const formData = new FormData(contactForm);
            formData.set('name', name);
            formData.set('email', email);
            formData.set('message', message);

            const response = await fetch(formEndpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    Accept: 'application/json'
                },
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error('FormSubmit could not accept the message.');
            }

            await response.json().catch(() => null);
            contactForm.reset();
            setStatus('Message sent. I will get back to you soon.', 'success');
        } catch (error) {
            const fallbackLink = buildMailtoLink(name, email, message);
            const fallbackAnchor = document.createElement('a');

            fallbackAnchor.href = fallbackLink;
            fallbackAnchor.textContent = 'Open email instead';

            setStatus('FormSubmit is taking too long. You can try again or email me directly.', 'error');
            formStatus.append(' ', fallbackAnchor, '.');
        } finally {
            window.clearTimeout(timeoutId);
            resetSubmitButton();
        }
    });
}

if (controllerCanvas) {
    const context = controllerCanvas.getContext('2d');
    let width = 0;
    let height = 0;

    const resizeController = () => {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = controllerCanvas.clientWidth;
        height = controllerCanvas.clientHeight;

        controllerCanvas.width = Math.max(1, Math.floor(width * pixelRatio));
        controllerCanvas.height = Math.max(1, Math.floor(height * pixelRatio));
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const roundedRect = (x, y, rectWidth, rectHeight, radius) => {
        const safeRadius = Math.min(radius, rectWidth / 2, rectHeight / 2);

        context.beginPath();
        context.moveTo(x + safeRadius, y);
        context.lineTo(x + rectWidth - safeRadius, y);
        context.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + safeRadius);
        context.lineTo(x + rectWidth, y + rectHeight - safeRadius);
        context.quadraticCurveTo(x + rectWidth, y + rectHeight, x + rectWidth - safeRadius, y + rectHeight);
        context.lineTo(x + safeRadius, y + rectHeight);
        context.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - safeRadius);
        context.lineTo(x, y + safeRadius);
        context.quadraticCurveTo(x, y, x + safeRadius, y);
        context.closePath();
    };

    const drawStick = (x, y, radius) => {
        const gradient = context.createRadialGradient(
            x - radius * 0.3,
            y - radius * 0.35,
            radius * 0.2,
            x,
            y,
            radius
        );

        gradient.addColorStop(0, '#4a5261');
        gradient.addColorStop(0.5, '#16191f');
        gradient.addColorStop(1, '#050607');

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        context.lineWidth = 2;
        context.stroke();
    };

    const drawController = (time) => {
        if (!width || !height) {
            return;
        }

        const centerX = width / 2;
        const centerY = height / 2;
        const scale = Math.min(width / 560, height / 360);
        const floatY = Math.sin(time * 0.002) * 7;
        const tilt = Math.sin(time * 0.0014) * 0.035;

        context.clearRect(0, 0, width, height);

        context.save();
        context.translate(centerX, centerY + floatY);
        context.rotate(tilt);
        context.scale(scale, scale);

        const glow = context.createRadialGradient(0, 30, 40, 0, 30, 270);
        glow.addColorStop(0, 'rgba(57, 255, 136, 0.24)');
        glow.addColorStop(0.45, 'rgba(75, 208, 255, 0.12)');
        glow.addColorStop(1, 'rgba(57, 255, 136, 0)');

        context.fillStyle = glow;
        context.beginPath();
        context.ellipse(0, 42, 270, 160, 0, 0, Math.PI * 2);
        context.fill();

        const bodyGradient = context.createLinearGradient(-220, -110, 220, 145);
        bodyGradient.addColorStop(0, '#4a5360');
        bodyGradient.addColorStop(0.44, '#20252e');
        bodyGradient.addColorStop(1, '#0d1015');

        context.fillStyle = bodyGradient;
        context.beginPath();
        context.moveTo(-72, -90);
        context.bezierCurveTo(-150, -110, -235, -52, -250, 36);
        context.bezierCurveTo(-264, 116, -210, 160, -154, 123);
        context.bezierCurveTo(-105, 90, -82, 92, -42, 103);
        context.bezierCurveTo(-18, 110, 18, 110, 42, 103);
        context.bezierCurveTo(82, 92, 105, 90, 154, 123);
        context.bezierCurveTo(210, 160, 264, 116, 250, 36);
        context.bezierCurveTo(235, -52, 150, -110, 72, -90);
        context.bezierCurveTo(38, -81, -38, -81, -72, -90);
        context.closePath();
        context.fill();

        context.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        context.lineWidth = 3;
        context.stroke();

        context.fillStyle = 'rgba(255, 255, 255, 0.1)';
        roundedRect(-86, -78, 172, 42, 18);
        context.fill();

        drawStick(-94, 15, 32);
        drawStick(76, 58, 30);

        context.fillStyle = '#0a0c10';
        roundedRect(-40, -14, 80, 50, 18);
        context.fill();

        context.strokeStyle = '#39ff88';
        context.lineWidth = 4;
        context.beginPath();
        context.arc(0, 9, 14, 0, Math.PI * 2);
        context.stroke();

        context.fillStyle = '#0b0d11';
        roundedRect(-185, 29, 66, 19, 5);
        roundedRect(-162, 5, 19, 66, 5);
        context.fill();

        const buttonColors = ['#47d96c', '#f0d64a', '#3ca8ff', '#ff5d5d'];
        const positions = [
            [164, -16],
            [136, 12],
            [192, 12],
            [164, 40]
        ];

        positions.forEach(([x, y], index) => {
            context.fillStyle = buttonColors[index];
            context.beginPath();
            context.arc(x, y, 14, 0, Math.PI * 2);
            context.fill();

            context.fillStyle = 'rgba(0, 0, 0, 0.24)';
            context.beginPath();
            context.arc(x + 3, y + 4, 8, 0, Math.PI * 2);
            context.fill();
        });

        context.fillStyle = 'rgba(255, 255, 255, 0.2)';
        roundedRect(-160, -124, 96, 28, 14);
        roundedRect(64, -124, 96, 28, 14);
        context.fill();

        context.restore();
    };

    const animate = (time) => {
        drawController(time);
        requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeController);
    resizeController();
    animate(0);
}
