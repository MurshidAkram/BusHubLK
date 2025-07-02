import React from 'react';
import { assets } from '../assets/assets';

const About = () => {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-blue-900 text-white py-24">
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About BusHubLK</h1>
            <p className="text-xl md:text-2xl font-light">
              Revolutionizing Sri Lanka's Public Transport Management
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <img 
                src={assets.about_img} 
                alt="SLTB Bus Depot" 
                className="rounded-lg shadow-xl w-full h-auto"
              />
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Mission</h2>
              <p className="text-gray-600 mb-6 text-lg">
                To modernize and streamline Sri Lanka Transport Board (SLTB) operations through 
                cutting-edge technology, ensuring efficient fleet management, improved passenger 
                services, and data-driven decision making.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p className="text-gray-700">
                    Digitizing the entire SLTB operations ecosystem
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p className="text-gray-700">
                    Reducing operational costs by 30% through automation
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p className="text-gray-700">
                    Enhancing passenger experience with real-time tracking
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Key System Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🚌",
                title: "Fleet Management",
                description: "Comprehensive tracking of all SLTB vehicles including maintenance schedules, fuel consumption, and driver assignments."
              },
              {
                icon: "📊",
                title: "Real-time Analytics",
                description: "Data-driven insights for route optimization, passenger load analysis, and operational efficiency."
              },
              {
                icon: "⏱️",
                title: "Schedule Automation",
                description: "Automated timetable management with dynamic adjustments for peak hours and special events."
              },
              {
                icon: "💰",
                title: "Revenue Management",
                description: "Integrated ticketing and fare collection system with centralized financial reporting."
              },
              {
                icon: "📱",
                title: "Passenger App Integration",
                description: "Seamless connectivity with mobile apps for real-time bus tracking and digital ticketing."
              },
              {
                icon: "🛠️",
                title: "Maintenance Alerts",
                description: "Predictive maintenance notifications to minimize vehicle downtime and improve safety."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Murshid Akram",
                role: "CEO & Founder",
                bio: "Transportation expert with 15+ years in public transit management",
                img: assets.team1
              },
              {
                name: "Sanjaya Bandara",
                role: "CTO",
                bio: "Tech visionary specializing in large-scale transport systems",
                img: assets.team2
              },
              {
                name: "Nimali Fernando",
                role: "Operations Director",
                bio: "Former SLTB operations manager with deep institutional knowledge",
                img: assets.team3
              },
              {
                name: "Kamal Silva",
                role: "Lead Developer",
                bio: "Full-stack developer focused on scalable solutions",
                img: assets.team4
              }
            ].map((member, index) => (
              <div key={index} className="bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <img src={member.img} alt={member.name} className="w-full h-64 object-cover"/>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
                  <p className="text-blue-600 mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SLTB Partnership Section */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Our Partnership with Sri Lanka Transport Board</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="mb-6 text-lg">
                  BusHubLK was developed in close collaboration with SLTB officials to ensure 
                  our solution meets the unique challenges of Sri Lanka's public transport system.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Official technology partner since 2023</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Deployed across 12 major depots island-wide</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Training provided to 1,200+ SLTB staff members</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white/10 p-8 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">System Impact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-4xl font-bold text-blue-300">40%</p>
                    <p className="text-sm">Reduction in scheduling conflicts</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-4xl font-bold text-blue-300">25%</p>
                    <p className="text-sm">Faster incident response</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-4xl font-bold text-blue-300">15%</p>
                    <p className="text-sm">Increase in fleet utilization</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-4xl font-bold text-blue-300">92%</p>
                    <p className="text-sm">Staff satisfaction rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About