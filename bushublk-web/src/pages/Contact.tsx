import React from 'react';
import { assets } from '../assets/assets';

const Contact = () => {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-blue-900 text-white py-24">
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact BusHubLK</h1>
            <p className="text-xl md:text-2xl font-light">
              Get in touch with our team for support, inquiries, or partnership opportunities
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-16">
            {/* Support Card */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
              <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Technical Support</h3>
              <p className="text-gray-600 mb-4">
                24/7 assistance for system issues and troubleshooting
              </p>
              <a href="mailto:support@bushublk.lk" className="text-blue-600 font-medium hover:text-blue-800">
                support@bushublk.lk
              </a>
              <p className="mt-2 text-gray-600">+94 11 2 123 457</p>
            </div>

            {/* General Inquiries Card */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
              <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">General Inquiries</h3>
              <p className="text-gray-600 mb-4">
                Questions about our services or partnership opportunities
              </p>
              <a href="mailto:info@bushublk.lk" className="text-blue-600 font-medium hover:text-blue-800">
                info@bushublk.lk
              </a>
              <p className="mt-2 text-gray-600">+94 11 2 123 456</p>
            </div>

            {/* SLTB Coordination Card */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
              <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">SLTB Coordination</h3>
              <p className="text-gray-600 mb-4">
                For official SLTB staff communications and coordination
              </p>
              <a href="mailto:sltb-coordination@bushublk.lk" className="text-blue-600 font-medium hover:text-blue-800">
                sltb-coordination@bushublk.lk
              </a>
              <p className="mt-2 text-gray-600">+94 11 2 123 458</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Send Us a Message</h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="What's this about?"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Type your message here..."
                  required
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 w-full md:w-auto"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Our Office Location</h2>
          <div className="rounded-xl overflow-hidden shadow-lg">
            <div className="h-96 w-full bg-gray-300 relative">
              {/* Replace with your actual map embed */}
              <iframe
                title="SLTB Headquarters Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.7985117576865!2d79.8534663153286!3d6.921668595003654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2593d2c387ba5%3A0x1a7203e8e8a3a7a5!2sSri%20Lanka%20Transport%20Board%20Headquarters!5e0!3m2!1sen!2slk!4v1620000000000!5m2!1sen!2slk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
            <div className="bg-white p-6">
              <h3 className="text-xl font-semibold mb-2">SLTB Headquarters</h3>
              <p className="text-gray-600">
                127, Sir Chittampalam A. Gardiner Mawatha, Colombo 02, Sri Lanka
              </p>
              <p className="text-gray-600 mt-2">
                <span className="font-medium">Office Hours:</span> Monday-Friday, 8:30 AM - 4:30 PM
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact