import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/mongodb.js'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRouter.js'
import orderRouter from './routes/orderRoute.js'
import wishListRouter from './routes/wishListRouter.js'
import reviewRoute from './routes/reviewRoute.js'
import categoryRouter from './routes/categoryRoute.js'
import lookRouter from './routes/lookRoutes.js'
import uploadRouter from './routes/uploadRoute.js'
import { handleMulterError } from './middleware/multer.js'

dotenv.config()

//App Config
const app = express()
const port = process.env.PORT || 4000
connectDB()

// Rate limiting (different buckets per risk surface) - define BEFORE use
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })
const paymentLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false })
const webhookLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false })
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false })

//middlewares
// Important: Raw body parser for webhooks must come before JSON parser
app.use('/api/order/stripe-webhook', express.raw({ type: 'application/json' }));
app.use('/api/order/razorpay-webhook', express.raw({ type: 'application/json' }));
app.use('/api/order/stripe-webhook', webhookLimiter)
app.use('/api/order/razorpay-webhook', webhookLimiter)
app.use('/api/order/stripe-webhook', webhookLimiter)
app.use('/api/order/razorpay-webhook', webhookLimiter)

// Regular middleware for other routes
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false, // allow loading images/resources from CDN (e.g., Cloudinary)
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}))
// Add a conservative Content Security Policy (mostly relevant if backend serves HTML)
app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    "default-src": ["'self'"],
    "img-src": ["'self'", 'data:', 'https:', 'http:'],
    "connect-src": ["'self'", 'https:', 'http:'],
  }
}))
if (process.env.NODE_ENV === 'production') {
  app.use(helmet.hsts({ maxAge: 15552000 })) // 180 days
}

// (rate limiters defined above)

// CORS configuration
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:4000'];
const PROD_ORIGINS = ['https://adaa-jaipur-ein-bin-tin.vercel.app', 'https://adaa-admin-jaipur-ein-bin-tin.vercel.app','https://adda-jaipur.vercel.app'];
const allowedOrigins = process.env.NODE_ENV === 'production' ? PROD_ORIGINS : [...DEV_ORIGINS, ...PROD_ORIGINS];

app.use(cors({
  origin: function (origin, callback) {
    // allow non-browser clients (e.g., curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'))

//api endpoints
app.use('/api/user', authLimiter, userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter);
app.use('/api/order', paymentLimiter, orderRouter);
app.use('/api/wishlist', wishListRouter);
app.use('/api/reviews', reviewRoute);
app.use('/api/category', categoryRouter); 
app.use('/api/looks', lookRouter);
app.use('/api/upload', uploadLimiter, uploadRouter);

app.get('/',(req,res)=>{
    res.send("API Working")
})

// Error handling for Stripe webhook
app.use((err, req, res, next) => {
    if (err.type === 'StripeSignatureVerificationError') {
        res.status(400).json({ success: false, message: 'Invalid Stripe webhook signature' });
    } else {
        next(err);
    }
});

// Multer error handling
app.use(handleMulterError);

// Global error handler
app.use((err, req, res, next) => {
    // Minimal log in production, detailed in development
    if (process.env.NODE_ENV === 'production') {
        console.error('Error:', err.message);
    } else {
        console.error('Error:', err);
    }
    res.status(500).json({ 
        success: false, 
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

app.listen(port,()=>console.log('Server started on Port:'+port))

// Fail-fast handlers
process.on('unhandledRejection', (reason) => {
  console.error('UnhandledRejection:', reason instanceof Error ? reason.message : reason)
})
process.on('uncaughtException', (err) => {
  console.error('UncaughtException:', err.message)
})