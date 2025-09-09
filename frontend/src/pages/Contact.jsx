import React, { useState } from 'react';
import { Send, MapPin, Phone, Mail, Clock, Instagram } from 'lucide-react';
import { Card, CardContent } from "../components/ui/card";
import axios from 'axios';

const Contact = () => {
  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  // Newsletter states
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setNewsletterError('');

    if (!validateEmail(newsletterEmail)) {
      setNewsletterError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      
      const response = await axios.post(
        `${backendUrl}/api/newsletter/subscribe`,
        {
          email: newsletterEmail
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setNewsletterSuccess(true);
        setNewsletterEmail('');
        setTimeout(() => setNewsletterSuccess(false), 5000);
      } else {
        setNewsletterError(response.data.message || 'Subscription failed');
      }
    } catch (err) {
      console.error('Newsletter Error:', err);
      const errorMessage = err.response?.data?.message || 'Subscription failed';
      setNewsletterError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCF8F7]">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-r from-[#F5E1E4] to-[#EBD4D9] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 opacity-10 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-full h-full border-[64px] border-[#C98388] rounded-full" />
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 opacity-10 transform translate-x-1/2 -translate-y-1/2">
            <div className="w-full h-full border-[80px] border-[#B87377] rounded-full" />
          </div>
        </div>
        
        <div className="container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center z-10 space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-[#3D2C2E] mb-4" style={{ fontFamily: 'serif' }}>
              Get in Touch
            </h1>
            <p className="text-xl text-[#5E4146] font-serif">Experience the Elegance of Adaa Jaipur</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left Column */}
          <div className="space-y-8">
            <Card className="border-[#EDD2D5] hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardContent className="p-8">
                <h2 className="text-3xl font-serif text-[#3D2C2E] mb-8">Visit Our Shop</h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 group">
                    <MapPin className="w-6 h-6 text-[#B76E79] mt-1 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="font-semibold text-lg">Our Store</h3>
                      <p className="text-gray-700">Pink Square Mall, Govind Marg</p>
                      <p className="text-gray-700">Raja Park, Jaipur, Rajasthan</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 group">
                    <Phone className="w-6 h-6 text-[#B76E79] mt-1 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="font-semibold text-lg">Call Us</h3>
                      <p className="text-gray-700">+91 98765 43210</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 group">
                    <Mail className="w-6 h-6 text-[#B76E79] mt-1 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="font-semibold text-lg">Email Us</h3>
                      <p className="text-gray-700">contact@adaajaipur.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 group">
                    <Clock className="w-6 h-6 text-[#B76E79] mt-1 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="font-semibold text-lg">Store Hours</h3>
                      <p className="text-gray-700">Mon - Sat: 11:00 AM - 9:00 PM</p>
                      <p className="text-gray-700">Sunday: 12:00 PM - 8:00 PM</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 group">
                    <Instagram className="w-6 h-6 text-[#B76E79] mt-1 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="font-semibold text-lg">Follow Us</h3>
                      <p className="text-gray-700">@adaa_jaipur</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Newsletter Section */}
            <Card className="border-[#EDD2D5] overflow-hidden bg-gradient-to-br from-[#FFF5F5] to-[#F8F0F5]">
              <CardContent className="p-8">
                <h2 className="text-3xl font-serif text-[#3D2C2E] mb-4">Join Our Family</h2>
                <p className="text-gray-700 mb-6">Subscribe for exclusive offers and updates on new collections</p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                  <div className="flex">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className={`flex-1 px-4 py-3 border border-[#E8B4B8] rounded-l-md focus:outline-none focus:border-[#B76E79] bg-white ${
                        newsletterError ? 'border-red-500' : ''
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`bg-[#B76E79] text-white px-8 py-3 rounded-r-md transition-colors ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#9B5B64]'
                      }`}
                    >
                      {isSubmitting ? 'Submitting...' : 'Subscribe'}
                    </button>
                  </div>
                  {newsletterError && (
                    <p className="text-red-500 text-sm">{newsletterError}</p>
                  )}
                  {newsletterSuccess && (
                    <p className="text-green-500 text-sm">
                      Thank you for subscribing! 🎉
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact Form */}
          <Card className="border-[#EDD2D5] bg-white">
            <CardContent className="p-8">
              <h2 className="text-3xl font-serif text-[#3D2C2E] mb-8">Send Us a Message</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Your Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-[#E8B4B8] rounded-md focus:outline-none focus:border-[#B76E79] bg-white"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-[#E8B4B8] rounded-md focus:outline-none focus:border-[#B76E79] bg-white"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Your Message</label>
                  <textarea
                    className="w-full px-4 py-3 border border-[#E8B4B8] rounded-md h-40 focus:outline-none focus:border-[#B76E79] bg-white"
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-[#B76E79] text-white px-8 py-4 rounded-md hover:bg-[#9B5B64] transition-colors flex items-center justify-center space-x-2 text-lg"
                >
                  <span>Send Message</span>
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;