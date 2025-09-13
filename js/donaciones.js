// UltraGol - Módulo de Donaciones con PayPal
// Integración con PayPal para procesamiento de pagos

class DonationsManager {
    constructor() {
        this.paypal = null;
        this.currentAmount = 0;
        this.paypalClientId = null;
        this.environment = 'sandbox';
        
        this.initializePayPal();
        this.initializeEventListeners();
    }

    async initializePayPal() {
        try {
            // Obtener configuración de PayPal desde el servidor
            const config = await this.getPayPalConfig();
            this.paypalClientId = config.client_id;
            this.environment = config.environment;
            
            // Cargar el SDK de PayPal dinámicamente
            await this.loadPayPalSDK();
            
            console.log('PayPal inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar PayPal:', error);
            this.showError('Error al inicializar el sistema de pagos');
        }
    }

    async getPayPalConfig() {
        try {
            const response = await fetch('/api/paypal/config');
            if (!response.ok) {
                throw new Error('Error al obtener configuración de PayPal');
            }
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo configuración de PayPal:', error);
            throw error;
        }
    }

    async loadPayPalSDK() {
        return new Promise((resolve, reject) => {
            // Si PayPal ya está cargado, resolver inmediatamente
            if (window.paypal) {
                resolve();
                return;
            }

            // Cargar el script de PayPal
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${this.paypalClientId}&currency=MXN`;
            script.async = true;
            
            script.onload = () => {
                console.log('PayPal SDK cargado correctamente');
                resolve();
            };
            
            script.onerror = () => {
                console.error('Error cargando PayPal SDK');
                reject(new Error('Error cargando PayPal SDK'));
            };
            
            document.head.appendChild(script);
        });
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
            
            if (amount > 50000) {
                this.showError('La cantidad máxima permitida es $50,000 MXN');
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

        // Inicializar botón de PayPal
        await this.initializePayPalButton(amount);
    }

    async initializePayPalButton(amount) {
        if (!window.paypal) {
            this.showError('PayPal no está disponible');
            return;
        }

        const container = document.getElementById('paypal-button-container');
        if (!container) {
            console.error('Contenedor de PayPal no encontrado');
            return;
        }

        // Limpiar contenedor anterior
        container.innerHTML = '';

        try {
            // Renderizar botón de PayPal
            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    return this.createPayPalOrder(amount);
                },
                onApprove: (data, actions) => {
                    return this.onPayPalApprove(data, actions);
                },
                onCancel: (data) => {
                    this.onPayPalCancel(data);
                },
                onError: (err) => {
                    this.onPayPalError(err);
                },
                style: {
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'paypal',
                    height: 50
                }
            }).render('#paypal-button-container');

        } catch (error) {
            console.error('Error inicializando botón de PayPal:', error);
            this.showError('Error al cargar el botón de pago');
        }
    }

    async createPayPalOrder(amount) {
        try {
            const response = await fetch('/api/paypal/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    amount: amount.toString(),
                    currency: 'MXN'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error del servidor');
            }

            const orderData = await response.json();
            return orderData.id;

        } catch (error) {
            console.error('Error creando orden de PayPal:', error);
            this.showError('Error al crear la orden de pago');
            throw error;
        }
    }

    async onPayPalApprove(data, actions) {
        try {
            const response = await fetch(`/api/paypal/order/${data.orderID}/capture`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error del servidor');
            }

            const orderData = await response.json();
            this.handlePaymentSuccess(orderData);

        } catch (error) {
            console.error('Error capturando orden de PayPal:', error);
            this.showError('Error al procesar el pago');
        }
    }

    onPayPalCancel(data) {
        console.log('Pago cancelado por el usuario:', data);
        this.showInfo('Pago cancelado por el usuario');
    }

    onPayPalError(err) {
        console.error('Error en PayPal:', err);
        this.showError('Error en el proceso de pago de PayPal');
    }

    handlePaymentSuccess(orderData) {
        console.log('Pago exitoso:', orderData);
        
        // Cerrar modal
        this.closePaymentModal();

        // Mostrar mensaje de éxito
        this.showSuccessMessage();

        // Registrar donación si el usuario está logueado
        this.recordDonation(orderData);

        // Enviar eventos de analytics si están configurados
        this.trackDonation(this.currentAmount);
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
                <p>PayPal te enviará un recibo por email.</p>
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
            background: linear-gradient(135deg, #0070ba, #003087);
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
            background: linear-gradient(135deg, #0070ba, #003087);
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

    async recordDonation(orderData) {
        // Si Firebase está disponible y el usuario está logueado
        if (window.firebase && window.firebase.firestore && window.firebase.auth().currentUser) {
            try {
                const db = window.firebase.firestore();
                const user = window.firebase.auth().currentUser;
                
                await db.collection('donations').add({
                    userId: user.uid,
                    userEmail: user.email,
                    amount: this.currentAmount,
                    currency: 'MXN',
                    paypalOrderId: orderData.id,
                    status: orderData.status,
                    timestamp: window.firebase.firestore.Timestamp.now(),
                    platform: 'UltraGol',
                    paymentMethod: 'PayPal'
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

        // Limpiar contenedor de PayPal
        const container = document.getElementById('paypal-button-container');
        if (container) {
            container.innerHTML = '';
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

    showInfo(message) {
        // Crear elemento de información
        const infoElement = document.createElement('div');
        infoElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #17a2b8;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            z-index: 10002;
            max-width: 300px;
            box-shadow: 0 5px 15px rgba(23, 162, 184, 0.3);
        `;
        
        infoElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; margin-left: auto; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(infoElement);

        // Auto-remove después de 3 segundos
        setTimeout(() => {
            if (infoElement.parentNode) {
                infoElement.remove();
            }
        }, 3000);
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