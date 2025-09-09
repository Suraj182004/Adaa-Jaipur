import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const newsletterRouter = express.Router();

// Subscribe to newsletter via Mailchimp
newsletterRouter.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Get Mailchimp credentials from environment
        const apiKey = process.env.MAILCHIMP_API_KEY;
        const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

        if (!apiKey || !audienceId) {
            console.error('Missing Mailchimp credentials');
            return res.status(500).json({
                success: false,
                message: 'Newsletter service not configured'
            });
        }

        // Extract data center from API key
        const dataCenter = apiKey.split('-').pop();

        // Subscribe to Mailchimp
        const response = await axios.post(
            `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
            {
                email_address: email,
                status: 'subscribed'
            },
            {
                headers: {
                    'Authorization': `apikey ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if ([200, 201].includes(response.status)) {
            res.status(200).json({
                success: true,
                message: 'Successfully subscribed to newsletter!'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to subscribe to newsletter'
            });
        }

    } catch (error) {
        console.error('Newsletter subscription error:', error.response?.data || error.message);
        
        const errorMessage = error.response?.data?.title || 'Subscription failed';
        let userMessage = 'Failed to subscribe to newsletter';
        
        if (errorMessage.includes('already subscribed')) {
            userMessage = 'Email is already subscribed';
        } else if (errorMessage.includes('forgotten email')) {
            userMessage = 'Email was previously unsubscribed';
        }

        res.status(400).json({
            success: false,
            message: userMessage
        });
    }
});

export default newsletterRouter;
