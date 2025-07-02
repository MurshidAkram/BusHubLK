import React from 'react';
import { assets } from '../assets/assets';

const Header = () => {
  return (
    <div>
    <section className="relative w-full h-screen overflow-hidden">
      {/* Hero Image */}
      <div className="absolute inset-0">
        <img
          src={assets.header_img}
          alt="Hero Background"
          className="w-full h-full object-cover"
        />
        {/* Enhanced Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-blue-900/20"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6 sm:px-8 lg:px-12">
        {/* Main Heading with Animation */}
        <div className="mb-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 leading-tight">
            <span className="block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Welcome to
            </span>
            <span className="block bg-gradient-to-r from-blue-500  to-blue-500 bg-clip-text text-transparent font-extrabold">
              BusHubLK
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className="mb-12 max-w-4xl">
          <p className="text-xl sm:text-2xl md:text-3xl text-blue-100 font-light leading-relaxed">
            Seamless Fleet and Operations Management for the Sri Lanka Transport Board
          </p>
        </div>
      </div>
    </section>

<section className="py-16 bg-gray-50">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { icon: "⚡", title: "Fast & Reliable", desc: "Lightning-fast performance with 99.9% uptime." },
        { icon: "🔒", title: "Secure", desc: "End-to-end encryption for your data." },
        { icon: "🔄", title: "Easy to Use", desc: "Intuitive interface for seamless experience." }
      ].map((feature, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-md text-center">
          <span className="text-4xl mb-4 block">{feature.icon}</span>
          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
          <p className="text-gray-600">{feature.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>

<section className="py-16 bg-blue-700 text-white">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { name: "John D.", role: "CEO, TechCorp", quote: "This platform transformed our workflow!" },
        { name: "Sarah K.", role: "Marketing Lead", quote: "Easy to use and highly effective." },
        { name: "Mike T.", role: "Developer", quote: "The best tool I've used this year." }
      ].map((testimonial, i) => (
        <div key={i} className="bg-blue-800 p-6 rounded-lg">
          <p className="italic mb-4">"{testimonial.quote}"</p>
          <p className="font-semibold">{testimonial.name}</p>
          <p className="text-blue-200">{testimonial.role}</p>
        </div>
      ))}
    </div>
  </div>
</section>
<section className="py-16 bg-gray-50">
  <div className="container mx-auto px-4 max-w-4xl">
    <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
    <div className="space-y-4">
      {[
        { question: "Is there a free trial?", answer: "Yes, we offer a 14-day free trial." },
        { question: "How do I cancel?", answer: "You can cancel anytime from your dashboard." },
        { question: "Is my data secure?", answer: "We use industry-standard encryption." }
      ].map((faq, i) => (
        <div key={i} className="border-b pb-4">
          <h3 className="font-semibold text-lg">{faq.question}</h3>
          <p className="text-gray-600 mt-1">{faq.answer}</p>
        </div>
      ))}
    </div>
  </div>
</section>
    </div>
    
  );
};

export default Header;