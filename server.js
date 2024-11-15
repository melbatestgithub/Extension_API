const express = require('express');
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

const allowedOrigins = [
    'chrome-extension://paijfbkpnafhmoeiepjhbadjlbagnged', 
    'https://extension-api-2v7n.onrender.com' 
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
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: 'https://extension-api-2v7n.onrender.com/success.html',
            cancel_url: 'https://extension-api-2v7n.onrender.com/cancel.html',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Israel Fact Checker for Unlimited Access.Once you pay this You have Unlimited access.',
                        },
                        unit_amount: 1800, // $18.00
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
