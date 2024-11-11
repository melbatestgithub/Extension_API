const express = require('express');
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  'chrome-extension://gobdibcbkaehioglmegimofidiakkbfk',
  'https://reasonate.vayomar.com'
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

// Stripe webhook secret
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

// Middleware to parse incoming Stripe webhook requests
app.use(bodyParser.raw({ type: 'application/json' }));

// Webhook endpoint for handling payment events from Stripe
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    // Handle the event based on its type
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;

        if (session.payment_status === 'paid') {
          const userEmail = session.customer_email;
          console.log(`Payment received from ${userEmail}`);
          
          // Optionally, notify your extension or perform additional steps here
          // Example: Send message to extension to update the payment status
          console.log('Payment completed, update extension status');
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Respond to Stripe to acknowledge the event
    res.status(200).send('Event received');
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Endpoint to create a new checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { checksUsed } = req.body;

    let price = 0;
    if (checksUsed >= 2) {
      price = 1800; // $18 for unlimited use (in cents)
    }

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
