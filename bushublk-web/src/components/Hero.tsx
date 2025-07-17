import React from 'react';
import { assets } from '../assets/assets';

const Header = () => {
  return (
    <div>
      {/* ======= Hero Section ======= */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Background Image */}
        <img
          src={assets.header_img}
          alt="Inside view of a bus at night"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {/* Softer Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/50 to-black/30"></div>

        {/* Animated Blobs (hidden on small screens) */}
        <div className="absolute inset-0 overflow-hidden hidden md:block">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6 sm:px-8 lg:px-12 pt-25 sm:pt-28 md:pt-32">
          {/* Small “Welcome to” */}
          <h1
            className="mb-2 text-5xl sm:text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            Welcome to
          </h1>

          {/* Big Brand Name */}
          <h2
            className="mb-4 text-7xl sm:text-8xl md:text-9xl font-extrabold text-blue-500 drop-shadow-lg"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            BusHubLK
          </h2>

          {/* Subtitle */}
         <div className="mt-8 mb-6 text-center font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent leading-relaxed">
            <p className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              Seamless Fleet &amp; Operations Management for the Sri Lanka Transport Board
            </p>
         </div>
         
         <div className="mt-4 mb-6 flex flex-wrap justify-center gap-6">
            {[
              { icon: '⚡', title: 'Fast & Reliable',  desc: 'Get instant updates & notifications' },
              { icon: '🗺️', title: 'Manage routes',   desc: 'Live map view & route management' },
              { icon: '⏰', title: 'Optimize schedules', desc: 'Balance conflict free timetables' },
              { icon: '👥', title: 'Coordinate staff',  desc: 'Role‑based job assignments' },
            ].map((item, i) => (
              <div
                key={i}
                style={{ willChange: 'transform, padding' }}
                className="
                  bg-white/20
                  backdrop-blur-sm
                  px-16 py-4
                  flex-shrink-0
                  rounded-lg
                  text-white
                  text-lg sm:text-xl
                  font-medium
                  transition-transform
                  transition-padding
                  duration-300
                  ease-in-out
                  hover:px-17
                  hover:py-4
                  hover:scale-110
                  text-center
                "
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-semibold">{item.title}</div>
                <div className="mt-1 text-sm sm:text-base text-white/80 italic">{item.desc}</div>
              </div>
            ))}
          </div>


          {/* Primary CTA */}
          <a
            href="#features"
            className="mt-12 inline-block px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full transition-shadow shadow-md hover:shadow-lg text-lg sm:text-xl"
          >
            Get Started
          </a>

          {/* Scroll‐down Cue */}
          <div className="absolute bottom-8 animate-bounce">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ======= Why Choose Us ======= */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-3xl font-bold text-center">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '⚡', title: 'Fast & Reliable', desc: 'Lightning-fast performance with 99.9% uptime.' },
              { icon: '🔒', title: 'Secure', desc: 'End-to-end encryption for your data.' },
              { icon: '🔄', title: 'Easy to Use', desc: 'Intuitive interface for seamless experience.' },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md text-center">
                <span className="mb-4 block text-4xl">{feature.icon}</span>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= Testimonials ======= */}
      <section className="py-16 bg-blue-700 text-white">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-3xl font-bold text-center">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Kasuntha P.', role: 'Depot Manager, Kandy', quote: 'Real‑time alerts have cut my incident response time by 40%.' },
              { name: 'Nishantha D', role: 'Head of Operations, Colombo', quote: 'Route‑efficiency reports helped us save 15% on fuel last quarter.' },
              { name: 'Arjun M', role: 'Mechanic Supervisor, Jaffna', quote: 'Maintenance schedules and parts tracking are a game‑changer.' },
            ].map((t, i) => (
              <div key={i} className="bg-blue-800 p-6 rounded-lg">
                <p className="mb-4 italic">"{t.quote}"</p>
                <p className="font-semibold">{t.name}</p>
                <p className="text-blue-200">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= FAQ ======= */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="mb-12 text-3xl font-bold text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                question: 'Can I manage multiple depots or regions from a single account?',
                answer:
                  'Yes, BusHubLK supports multi-site management. Create separate hubs for each depot, assign vehicles & staff, and view consolidated or depot-specific dashboards.',
              },
              {
                question: 'What level of user permission controls are available?',
                answer:
                  'Define role-based access for Admins, Dispatchers, Mechanics, and Drivers. Each role can be restricted to specific modules.',
              },
              {
                question: 'Does BusHubLK offer real-time bus tracking?',
                answer:
                  'Absolutely—track your entire fleet live on a map, with ETA predictions and route-optimization suggestions.',
              },
            ].map((faq, i) => (
              <div key={i} className="border-b pb-4">
                <h3 className="text-lg font-semibold">{faq.question}</h3>
                <p className="mt-1 text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Header;