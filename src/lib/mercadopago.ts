import mercadopago from 'mercadopago';

// Configuração do Mercado Pago
mercadopago.configure({
    access_token: process.env.VITE_MERCADOPAGO_ACCESS_TOKEN || ''
});

export const createSubscription = async (email: string) => {
    try {
        const preference = {
            items: [{
                title: 'Assinatura Mensal',
                quantity: 1,
                currency_id: 'BRL',
                unit_price: 29.90,
            }],
            payer: {
                email: email
            },
            back_urls: {
                success: `${window.location.origin}/assinatura-sucesso`,
                failure: `${window.location.origin}/assinatura-cancelada`,
            },
            auto_return: 'approved',
            payment_methods: {
                excluded_payment_types: [
                    { id: 'ticket' } // Exclui boleto
                ],
                installments: 1 // Pagamento à vista
            },
            notification_url: `${window.location.origin}/api/webhook-mercadopago`
        };

        const response = await mercadopago.preferences.create(preference);
        return response.body.init_point;
    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        throw error;
    }
};

export const verifySubscription = async (paymentId: string) => {
    try {
        const response = await mercadopago.payment.get(paymentId);
        return response.body.status === 'approved';
    } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        throw error;
    }
};
