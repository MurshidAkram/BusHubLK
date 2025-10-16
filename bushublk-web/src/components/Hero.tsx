import React from "react";
import { motion } from "framer-motion";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";


const Header = () => {
  return (
    <div className="w-full overflow-hidden bg-gray-950 text-white">
      {/* ===== HERO SECTION ===== */}
      <section className="relative flex flex-col items-center justify-center text-center h-[90vh] sm:h-screen">
        {/* Background Image + Softer Overlay */}
        <img
          src={assets.header_img}
          alt="Bus interior at night"
          className="absolute inset-0 w-full h-full object-cover brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />

        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 px-6 sm:px-10 max-w-4xl"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-4">
            Smarter Public Transport with{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              BusHubLK
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto mb-8">
            A unified platform built for the Sri Lanka Transport Board.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="#features"
              className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 shadow-md text-lg font-semibold"
            >
              Explore Features
            </a>
            <Link
  to="/contact"
  className="px-8 py-3 rounded-full border border-white/70 hover:bg-white/10 transition-all duration-300 text-lg font-semibold"
>
  Contact Us
</Link>

          </div>
        </motion.div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-8 flex flex-col items-center text-gray-300">
          <span className="text-sm mb-1">Scroll Down</span>
          <div className="animate-bounce">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section
        id="features"
        className="relative bg-white text-gray-800 py-20 px-6 sm:px-10"
      >
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">
            Why Choose BusHubLK?
          </h2>
          <p className="text-lg text-gray-600">
            Empowering transport management with technology — efficient,
            scalable, and simple to use.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: "🛰️",
              title: "Live Bus Tracking",
              desc: "Monitor every bus in real time with GPS-integrated insights.",
            },
            {
              icon: "⚙️",
              title: "Fleet Management",
              desc: "Manage maintenance, breakdowns, and fuel usage efficiently.",
            },
            {
              icon: "💳",
              title: "Smart Ticketing",
              desc: "Enable QR-based payments and reservation tracking.",
            },
            {
              icon: "📊",
              title: "Operational Analytics",
              desc: "Get reports that help optimize routes and reduce downtime.",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
      <section className="bg-gradient-to-b from-blue-700 to-blue-900 text-white py-20 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-lg text-blue-100">
            Real feedback from the teams managing Sri Lanka’s transport network
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              name: "Kasuntha P.",
              role: "Depot Manager, Kandy",
              quote:
                "“BusHubLK helped us streamline fleet operations and reduce delays across routes.”",
            },
            {
              name: "Nishantha D.",
              role: "Head of Operations, Colombo",
              quote:
                "“The live tracking dashboard has improved coordination between our drivers and dispatchers.”",
            },
            {
              name: "Arjun M.",
              role: "Maintenance Supervisor, Jaffna",
              quote:
                "“Automated maintenance schedules are a lifesaver — fewer breakdowns, smoother operations.”",
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-blue-800/40 border border-blue-600 rounded-xl p-8 backdrop-blur-sm hover:scale-105 transition-all duration-300"
            >
              <p className="mb-4 text-lg italic text-blue-100">{t.quote}</p>
              <h4 className="font-semibold text-white">{t.name}</h4>
              <p className="text-blue-300 text-sm">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Header;
