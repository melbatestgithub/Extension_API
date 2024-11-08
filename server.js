const express = require('express');
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Define the allowed origins, including the Chrome extension
const allowedOrigins = [
    'chrome-extension://gobdibcbkaehioglmegimofidiakkbfk', // Chrome extension origin
    'https://reasonate.vayomar.com' // Add the front-end origin, if needed
];

// Configure CORS middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests from specified origins
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

// Route to create a checkout session
app.post('/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: 'https://reasonate.vayomar.com/online-flow',
            cancel_url: 'https://reasonate.vayomar.com/cancel',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Fact Checker Subscription',
                        },
                        unit_amount: 1000, 
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
