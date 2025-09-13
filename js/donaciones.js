// UltraGol - Módulo de Donaciones
// Integración con Stripe para procesamiento de pagos

class DonationsManager {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.paymentElement = null;
        this.currentAmount = 0;
        this.paymentIntent = null;
        
        this.initializeStripe();
        this.initializeEventListeners();
    }

    async initializeStripe() {
        // Verificar si Stripe está cargado
        if (typeof Stripe === 'undefined') {
            console.error('Stripe.js no está cargado');
            this.showError('Error: Sistema de pagos no disponible');
            return;
        }

        // Inicializar Stripe (la clave pública se establecerá desde las variables de entorno)
        const publishableKey = this.getStripePublishableKey();
        if (!publishableKey) {
            console.error('Clave pública de Stripe no configurada');
            this.showError('Sistema de pagos no configurado');
            return;
        }

        try {
            this.stripe = Stripe(publishableKey);
            console.log('Stripe inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar Stripe:', error);
            this.showError('Error al inicializar el sistema de pagos');
        }
    }

    getStripePublishableKey() {
        // En un entorno real, esto vendría de variables de entorno
        // Por ahora, usamos una clave de prueba por defecto
        return window.STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef'; // Esta será reemplazada por la clave real
    }

    initializeEventListeners() {
        // Botones de planes de donación
        const planButtons = document.querySelectorAll('.plan-button');
        planButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePlanSelection(button);
            });
        });

        // Input de cantidad personalizada
        const customInput = document.getElementById('customAmount');
        if (customInput) {
            customInput.addEventListener('input', this.updateCustomAmount.bind(this));
        }

        // Modal controls
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', this.closePaymentModal.bind(this));
        }

        // Cerrar modal al hacer clic fuera
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closePaymentModal();
                }
            });
        }

        // Form de pago
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', this.handlePaymentSubmit.bind(this));
        }
    }

    updateCustomAmount() {
        const customInput = document.getElementById('customAmount');
        if (customInput && customInput.value) {
            const amount = parseFloat(customInput.value);
            if (amount && amount >= 10) {
                // Actualizar el botón personalizado
                const customButton = document.querySelector('[data-amount="custom"]');
                if (customButton) {
                    customButton.innerHTML = `
                        <i class="fas fa-heart"></i>
                        Donar $${amount} MXN
                    `;
                }
            }
        }
    }

    async handlePlanSelection(button) {
        const amountData = button.getAttribute('data-amount');
        let amount;

        if (amountData === 'custom') {
            const customInput = document.getElementById('customAmount');
            amount = parseFloat(customInput.value);
            
            if (!amount || amount < 10) {
                this.showError('Por favor ingresa una cantidad mínima de $10 MXN');
                return;
            }
        } else {
            amount = parseFloat(amountData);
        }

        this.currentAmount = amount;
        await this.openPaymentModal(amount);
    }

    async openPaymentModal(amount) {
        const modal = document.getElementById('paymentModal');
        const donationAmountSpan = document.getElementById('donationAmount');
        
        if (donationAmountSpan) {
            donationAmountSpan.textContent = `$${amount} MXN`;
        }

        // Mostrar modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Inicializar Payment Element de Stripe
        await this.initializePaymentElement(amount);
    }

    async initializePaymentElement(amount) {
        if (!this.stripe) {
            this.showError('Sistema de pagos no disponible');
            return;
        }

        try {
            // Crear PaymentIntent en el servidor
            const clientSecret = await this.createPaymentIntent(amount);
            
            if (!clientSecret) {
                throw new Error('No se pudo crear la intención de pago');
            }

            // Crear Elements
            this.elements = this.stripe.elements({
                clientSecret: clientSecret,
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#ff9933',
                        colorBackground: '#ffffff',
                        colorText: '#1a1a1a',
                        colorDanger: '#dc3545',
                        fontFamily: 'Roboto, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '8px',
                    }
                }
            });

            // Crear Payment Element
            this.paymentElement = this.elements.create('payment', {
                layout: 'tabs'
            });

            // Montar el elemento
            this.paymentElement.mount('#payment-element');

            // Manejar errores en tiempo real
            this.paymentElement.on('change', (event) => {
                if (event.error) {
                    this.showError(event.error.message);
                } else {
                    this.clearErrors();
                }
            });

        } catch (error) {
            console.error('Error al inicializar Payment Element:', error);
            this.showError('Error al cargar el formulario de pago');
        }
    }

    async createPaymentIntent(amount) {
        try {
            // En un entorno real, esto sería una llamada a tu servidor
            // Por ahora, simulamos la respuesta del servidor
            const response = await this.callServer('/api/create-payment-intent', {
                amount: Math.round(amount * 100), // Convertir a centavos
                currency: 'mxn',
                metadata: {
                    platform: 'UltraGol',
                    type: 'donation'
                }
            });

            return response.client_secret;
        } catch (error) {
            console.error('Error al crear PaymentIntent:', error);
            throw error;
        }
    }

    async callServer(endpoint, data) {
        // Simulación de llamada al servidor
        // En producción, esto sería una llamada real a tu backend
        console.log('Llamada simulada al servidor:', endpoint, data);
        
        // Simulamos una respuesta exitosa
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% de éxito
                    resolve({
                        client_secret: 'pi_simulate_' + Math.random().toString(36).substr(2, 9) + '_secret_simulate',
                        status: 'success'
                    });
                } else {
                    reject(new Error('Error simulado del servidor'));
                }
            }, 1000);
        });
    }

    async handlePaymentSubmit(event) {
        event.preventDefault();

        if (!this.stripe || !this.elements) {
            this.showError('Sistema de pagos no disponible');
            return;
        }

        const submitButton = document.getElementById('submit-payment');
        const buttonText = submitButton.querySelector('span');
        const buttonLoading = submitButton.querySelector('.btn-loading');

        // Deshabilitar botón y mostrar loading
        submitButton.disabled = true;
        buttonText.style.display = 'none';
        buttonLoading.style.display = 'block';

        try {
            // Confirmar pago
            const { error, paymentIntent } = await this.stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: window.location.origin + '/donaciones.html?success=true',
                    receipt_email: this.getUserEmail(), // Si el usuario está logueado
                },
                redirect: 'if_required'
            });

            if (error) {
                this.showError(error.message);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                this.handlePaymentSuccess(paymentIntent);
            }

        } catch (error) {
            console.error('Error al procesar pago:', error);
            this.showError('Error al procesar el pago. Por favor intenta de nuevo.');
        } finally {
            // Rehabilitar botón
            submitButton.disabled = false;
            buttonText.style.display = 'block';
            buttonLoading.style.display = 'none';
        }
    }

    getUserEmail() {
        // Si está integrado con Firebase Auth, obtener email del usuario
        if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
            return window.firebase.auth().currentUser.email;
        }
        return null;
    }

    handlePaymentSuccess(paymentIntent) {
        console.log('Pago exitoso:', paymentIntent);
        
        // Cerrar modal
        this.closePaymentModal();

        // Mostrar mensaje de éxito
        this.showSuccessMessage();

        // Registrar donación si el usuario está logueado
        this.recordDonation(paymentIntent);

        // Enviar eventos de analytics si están configurados
        this.trackDonation(paymentIntent.amount / 100);
    }

    showSuccessMessage() {
        // Crear overlay de éxito
        const successOverlay = document.createElement('div');
        successOverlay.className = 'success-overlay';
        successOverlay.innerHTML = `
            <div class="success-content">
                <div class="success-icon">
                    <i class="fas fa-heart"></i>
                </div>
                <h2>¡Gracias por tu donación!</h2>
                <p>Tu apoyo es invaluable para seguir mejorando UltraGol.</p>
                <p>Recibirás un recibo por email en unos minutos.</p>
                <button onclick="this.parentElement.parentElement.remove()" class="success-btn">
                    <i class="fas fa-check"></i> Continuar
                </button>
            </div>
        `;

        // Estilos para el overlay
        successOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            backdrop-filter: blur(5px);
        `;

        document.body.appendChild(successOverlay);

        // Estilo para el contenido
        const successContent = successOverlay.querySelector('.success-content');
        successContent.style.cssText = `
            background: white;
            padding: 3rem;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            margin: 0 1rem;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;

        // Estilo para el icono
        const successIcon = successOverlay.querySelector('.success-icon');
        successIcon.style.cssText = `
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff9933, #e67e22);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            font-size: 2rem;
            color: white;
            animation: heartbeat 2s infinite;
        `;

        // Estilo para el botón
        const successBtn = successOverlay.querySelector('.success-btn');
        successBtn.style.cssText = `
            background: linear-gradient(135deg, #ff9933, #e67e22);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 15px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
            transition: transform 0.3s ease;
        `;

        // Auto-remove después de 10 segundos
        setTimeout(() => {
            if (successOverlay.parentNode) {
                successOverlay.remove();
            }
        }, 10000);
    }

    async recordDonation(paymentIntent) {
        // Si Firebase está disponible y el usuario está logueado
        if (window.firebase && window.firebase.firestore && window.firebase.auth().currentUser) {
            try {
                const db = window.firebase.firestore();
                const user = window.firebase.auth().currentUser;
                
                await db.collection('donations').add({
                    userId: user.uid,
                    userEmail: user.email,
                    amount: paymentIntent.amount / 100,
                    currency: 'MXN',
                    paymentIntentId: paymentIntent.id,
                    status: paymentIntent.status,
                    timestamp: window.firebase.firestore.Timestamp.now(),
                    platform: 'UltraGol'
                });

                console.log('Donación registrada en Firebase');
            } catch (error) {
                console.error('Error al registrar donación:', error);
            }
        }
    }

    trackDonation(amount) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                transaction_id: 'donation_' + Date.now(),
                value: amount,
                currency: 'MXN',
                items: [{
                    item_id: 'donation',
                    item_name: 'UltraGol Donation',
                    category: 'Donation',
                    quantity: 1,
                    price: amount
                }]
            });
        }

        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Purchase', {
                value: amount,
                currency: 'MXN'
            });
        }
    }

    closePaymentModal() {
        const modal = document.getElementById('paymentModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Limpiar Payment Element
        if (this.paymentElement) {
            this.paymentElement.unmount();
            this.paymentElement = null;
        }
        if (this.elements) {
            this.elements = null;
        }

        this.clearErrors();
    }

    showError(message) {
        // Crear o actualizar elemento de error
        let errorElement = document.getElementById('donation-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'donation-error';
            errorElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #dc3545;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 10px;
                z-index: 10002;
                max-width: 300px;
                box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
            `;
            document.body.appendChild(errorElement);
        }

        errorElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; margin-left: auto; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Auto-remove después de 5 segundos
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 5000);
    }

    clearErrors() {
        const errorElement = document.getElementById('donation-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Método para manejar success desde URL
    handleSuccessFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            this.showSuccessMessage();
            // Limpiar URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const donationsManager = new DonationsManager();
    
    // Verificar si viene de un pago exitoso
    donationsManager.handleSuccessFromURL();
    
    // Hacer disponible globalmente para debugging
    window.donationsManager = donationsManager;
});

// Configuración de variables de entorno (debe ser establecido desde el servidor)
// En producción, estas variables vendrían del servidor o de variables de entorno
window.STRIPE_PUBLISHABLE_KEY = 'pk_test_stripe_key_here'; // Esta será reemplazada por la clave real