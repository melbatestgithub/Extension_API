const express = require('express');
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

const allowedOrigins = [
    'chrome-extension://gobdibcbkaehioglmegimofidiakkbfk', 
    'https://localhost:3000' 
];

app.use(cors({
    origin: function (origin, callback) {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['POST'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use(express.static('public'))

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { checksUsed } = req.body;  
        let price = 0;
        if (checksUsed >= 2) {
            price = 1800;
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: 'http://localhost:3000/success.html',
            cancel_url: 'http://localhost:3000/cancel.html',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Fact Checker Subscription',
                        },
                        unit_amount: price,
                    },
                    quantity: 1,
                },
            ],
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating Stripe session:', error);
        res.status(500).json({ error: 'An error occurred during session creation' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
