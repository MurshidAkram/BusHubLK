import React from "react";

const LandingPage = () => {
  return (
    <div className="bg-white text-gray-800">
      {/* Navbar */}
      <header className="w-full fixed top-0 bg-white/80 backdrop-blur-md shadow z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">BushubLK</h1>
          <nav className="space-x-6 hidden md:flex">
            <a href="#features" className="hover:text-blue-600 transition">
              Features
            </a>
            <a href="#about" className="hover:text-blue-600 transition">
              About
            </a>
            <a href="#contact" className="hover:text-blue-600 transition">
              Contact
            </a>
          </nav>
          <div className="space-x-2">
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              Sign In
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition">
              Get Started
            </button>
          </div>
        </div>
      </header>

      <section className="py-24 bg-gradient-to-br from-blue-100 via-indigo-100 to-white">
  <div className="max-w-5xl mx-auto px-4 text-center">
    <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
      Bushublk Public Transport System
    </h1>
    <p className="text-lg text-gray-600 mb-8">
      Smart management tools for SLTB, passengers, and drivers.
    </p>
    <button className="bg-blue-600 text-white px-6 py-3 rounded-full shadow hover:bg-blue-700">
      Start Now
    </button>
  </div>
</section>


      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-12 text-gray-900">Key Features</h3>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Live Bus Tracking",
                desc: "Monitor all SLTB buses in real-time via Google Maps integration.",
                icon: "🛰️",
              },
              {
                title: "QR Ticketing",
                desc: "Passengers scan and pay instantly with digital QR codes.",
                icon: "📱",
              },
              {
                title: "Admin Dashboard",
                desc: "Web portal for operations & technical teams to manage services.",
                icon: "🧑‍💼",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-blue-50 rounded-xl p-6 shadow hover:shadow-lg transition"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Make Transport Smarter?
          </h3>
          <p className="mb-8 text-blue-100 text-lg">
            Join the next generation of public transport management in Sri Lanka.
          </p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition shadow-lg">
            Get Started with BushuBlk
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-xl font-bold text-white mb-3">BushuBlk</h4>
            <p>Smart transport solutions for Sri Lanka.</p>
          </div>
          <div>
            <h5 className="font-semibold text-white mb-2">Product</h5>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">Features</a></li>
              <li><a href="#" className="hover:text-white">Mobile App</a></li>
              <li><a href="#" className="hover:text-white">Admin Panel</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-white mb-2">Company</h5>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Team</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-white mb-2">Support</h5>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-8 text-sm text-gray-500">
          &copy; 2025 BushuBlk. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
