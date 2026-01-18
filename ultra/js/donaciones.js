function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('CLABE copiada al portapapeles');
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initPayPalSettings();
});

function initPayPalSettings() {
    const container = document.getElementById('paypal-button-container-settings');
    if (!container) return;

    // Limpiar contenedor si ya tiene botones
    container.innerHTML = '';

    paypal.Buttons({
        style: {
            layout: 'horizontal',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 40
        },
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: '3.00' // 3 Dólares
                    },
                    description: 'Donación ULTRAGOL'
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                alert('¡Gracias por tu apoyo, ' + details.payer.name.given_name + '!');
            });
        },
        onError: function(err) {
            console.error('PayPal Error:', err);
        }
    }).render('#paypal-button-container-settings');
}