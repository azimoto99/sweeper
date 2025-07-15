import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  StarIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  HomeIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  PlayIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const SERVICES = [
  {
    id: 'regular',
    name: 'Regular Cleaning',
    description: 'Keep your home consistently clean with our standard cleaning service',
    price: 'From $120',
    duration: '2-3 hours',
    icon: HomeIcon,
    features: ['Dusting all surfaces', 'Vacuuming & mopping', 'Bathroom cleaning', 'Kitchen cleaning']
  },
  {
    id: 'deep',
    name: 'Deep Cleaning',
    description: 'Comprehensive cleaning for move-ins, spring cleaning, or special occasions',
    price: 'From $250',
    duration: '4-5 hours',
    icon: SparklesIcon,
    features: ['Everything in regular', 'Baseboards & windowsills', 'Inside appliances', 'Light fixtures']
  },
  {
    id: 'airbnb',
    name: 'Airbnb Cleaning',
    description: 'Quick turnaround cleaning for short-term rental properties',
    price: 'From $80',
    duration: '1-2 hours',
    icon: HomeIcon,
    features: ['Fast turnaround', 'Linen change', 'Guest-ready standards', 'Same-day booking']
  },
  {
    id: 'office',
    name: 'Office Cleaning',
    description: 'Professional cleaning services for commercial spaces',
    price: 'From $150',
    duration: '2-4 hours',
    icon: BuildingOfficeIcon,
    features: ['Workstation cleaning', 'Common area maintenance', 'Restroom sanitization', 'Trash removal']
  }
]

const TESTIMONIALS = [
  {
    name: 'Maria Rodriguez',
    location: 'Laredo, TX',
    rating: 5,
    text: "Margarita's team is absolutely amazing! They've been cleaning my home for over a year and I couldn't be happier. Always thorough and professional."
  },
  {
    name: 'John Smith',
    location: 'Laredo, TX', 
    rating: 5,
    text: "Best cleaning service in Laredo! They're reliable, affordable, and do an incredible job. My house has never looked better."
  },
  {
    name: 'Carmen Lopez',
    location: 'Laredo, TX',
    rating: 5,
    text: "I use them for my Airbnb properties and they're fantastic. Quick turnaround times and guests always comment on how clean everything is."
  }
]

const WHY_CHOOSE_US = [
  {
    icon: ShieldCheckIcon,
    title: 'Fully Insured & Bonded',
    description: 'Complete peace of mind with full insurance coverage and bonded staff'
  },
  {
    icon: CheckCircleIcon,
    title: 'Quality Guaranteed',
    description: 'Not satisfied? We\'ll return within 24 hours to make it right'
  },
  {
    icon: ClockIcon,
    title: 'Flexible Scheduling',
    description: 'Book online 24/7 with same-day and next-day availability'
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Transparent Pricing',
    description: 'No hidden fees. See your exact price before booking'
  }
]

export function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeService, setActiveService] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % SERVICES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50 to-emerald-50 scroll-smooth overflow-x-hidden">
      {/* Modern Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-4 group cursor-pointer">
              <div className="relative">
                <div className="h-14 w-14 bg-gradient-to-br from-primary-500 via-emerald-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                  <SparklesIcon className="h-8 w-8 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Sweeper</h1>
                <p className="text-sm text-gray-500 font-medium">Smart Cleaning Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#services" className="nav-link">Services</a>
              <a href="#testimonials" className="nav-link">Reviews</a>
              <a href="#about" className="nav-link">About</a>
              <a href="tel:+19561234567" className="flex items-center text-primary-600 hover:text-primary-700 font-semibold transition-colors group">
                <PhoneIcon className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                (956) 123-4567
              </a>
              <div className="flex items-center space-x-4">
                <Link to="/auth/login" className="text-gray-700 hover:text-primary-600 font-semibold transition-colors">
                  Sign In
                </Link>
                <Link to="/auth/signup" className="btn-secondary">
                  Sign Up
                </Link>
                <Link to="/booking" className="btn-primary">
                  Book Now
                  <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 right-0 glass border-t border-white/20 p-4 space-y-4 animate-fade-in">
              <a href="#services" className="block py-2 text-gray-700 hover:text-primary-600 transition-colors">Services</a>
              <a href="#testimonials" className="block py-2 text-gray-700 hover:text-primary-600 transition-colors">Reviews</a>
              <a href="#about" className="block py-2 text-gray-700 hover:text-primary-600 transition-colors">About</a>
              <a href="tel:+19561234567" className="block py-2 text-primary-600 font-semibold">(956) 123-4567</a>
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <Link to="/auth/login" className="block py-2 text-gray-700 hover:text-primary-600 font-semibold transition-colors">
                  Sign In
                </Link>
                <Link to="/auth/signup" className="btn-secondary w-full justify-center">
                  Sign Up
                </Link>
                <Link to="/booking" className="btn-primary w-full justify-center">
                  Book Now
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-primary-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-gradient-to-br from-emerald-400/10 to-primary-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Status Badge */}
            <div className="inline-flex items-center space-x-3 glass rounded-full px-6 py-3 mb-8 shadow-soft border border-white/30">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-sm font-semibold text-gray-700">Available 24/7 • Instant Booking</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <span className="gradient-text block">Smart Cleaning</span>
              <span className="gradient-text-accent block">Made Simple</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Revolutionary cleaning platform connecting you with <span className="font-semibold text-emerald-600">verified professionals</span> in Laredo, TX. 
              <br className="hidden md:block" />
              Real-time tracking, instant booking, and guaranteed satisfaction.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link to="/booking" className="group btn-primary text-xl px-10 py-4 shadow-large">
                <CalendarIcon className="h-6 w-6 mr-3 group-hover:animate-bounce" />
                Start Your Journey
                <ArrowRightIcon className="h-5 w-5 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
              
              <button className="group btn-secondary text-xl px-10 py-4 shadow-medium">
                <PlayIcon className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                Watch Demo
              </button>
            </div>

            {/* Login/Dashboard Access */}
            <div className="mb-16">
              <div className="inline-flex items-center space-x-4 glass rounded-2xl px-8 py-4 shadow-soft border border-white/30">
                <div className="text-gray-600 font-medium">Already have an account?</div>
                <Link to="/auth/login" className="text-primary-600 hover:text-primary-700 font-bold transition-colors flex items-center group">
                  Sign in to your dashboard
                  <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {[
                { number: '500+', label: 'Happy Customers', color: 'text-emerald-600' },
                { number: '24/7', label: 'Support Available', color: 'text-primary-600' },
                { number: '4.9★', label: 'Average Rating', color: 'text-purple-600' },
                { number: '100%', label: 'Satisfaction', color: 'text-emerald-600' }
              ].map((stat, index) => (
                <div key={index} className="text-center group cursor-pointer">
                  <div className={`text-4xl font-bold ${stat.color} mb-2 group-hover:scale-110 transition-transform duration-300`}>
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Service Area Banner */}
      <section className="py-16 bg-gradient-to-r from-primary-600 via-emerald-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-4 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-6 group">
            <div className="p-4 glass rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <MapPinIcon className="h-8 w-8" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">Serving Laredo & Beyond</h2>
          </div>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Covering a 25-mile radius around Laredo, Texas with <span className="font-semibold text-yellow-300">same-day</span> and <span className="font-semibold text-yellow-300">next-day</span> service availability.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-3 glass rounded-full px-6 py-3 mb-8 shadow-soft border border-white/30">
              <SparklesIcon className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-gray-700">Premium Services</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Tailored Cleaning Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              From regular maintenance to deep cleaning transformations, our AI-powered platform matches you 
              with the perfect cleaning professional for your specific needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map((service, index) => (
              <div 
                key={service.id} 
                className={`group relative card-elevated p-8 hover:shadow-large transition-all duration-500 transform hover:-translate-y-2 overflow-hidden ${
                  activeService === index ? 'ring-2 ring-primary-500 shadow-primary-200' : ''
                }`}
              >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-emerald-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <service.icon className="h-8 w-8 text-white" />
                  </div>
                  {activeService === index && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors duration-300">{service.name}</h3>
                  <p className="text-gray-600 mb-6 min-h-[4rem] leading-relaxed">{service.description}</p>
                  
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-3xl font-bold gradient-text">{service.price}</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">{service.duration}</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm text-gray-700">
                        <CheckCircleIcon className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/booking" className="btn-primary w-full justify-center group-hover:scale-105">
                    Choose This Service
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link to="/booking" className="group btn-primary text-xl px-12 py-4 shadow-large">
              <CurrencyDollarIcon className="h-6 w-6 mr-3 group-hover:animate-pulse" />
              Get Your Free Quote
              <ArrowRightIcon className="h-5 w-5 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-primary-100 to-emerald-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-purple-100 to-primary-100 rounded-full blur-3xl opacity-50"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-3 glass rounded-full px-6 py-3 mb-8 shadow-soft border border-white/30">
              <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
              <span className="font-semibold text-gray-700">Why Choose Sweeper</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Built for Excellence
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              More than just a cleaning service - we're a technology-driven platform that revolutionizes 
              how professional cleaning works in your neighborhood.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {WHY_CHOOSE_US.map((item, index) => (
              <div key={index} className="group text-center card-interactive p-8">
                <div className="relative mb-6">
                  <div className="bg-gradient-to-br from-primary-100 via-emerald-100 to-purple-100 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                    <item.icon className="h-10 w-10 text-primary-600 group-hover:text-emerald-600 transition-colors duration-300" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-emerald-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors duration-300">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-3 glass rounded-full px-6 py-3 mb-8 shadow-soft border border-white/30">
              <StarIcon className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-gray-700">Customer Reviews</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Loved by Customers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Real stories from real customers who've experienced the Sweeper difference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="group relative">
                <div className="card-elevated p-8 hover:shadow-large transition-all duration-500 relative overflow-hidden transform group-hover:-translate-y-2">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-emerald-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Quote Icon */}
                  <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                    <svg className="h-12 w-12 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4.001v10h-10.001z"/>
                    </svg>
                  </div>
                  
                  <div className="relative">
                    {/* Stars */}
                    <div className="flex items-center mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400 mr-1" />
                      ))}
                    </div>
                    
                    {/* Review Text */}
                    <p className="text-gray-700 mb-8 text-lg italic leading-relaxed font-medium">
                      "{testimonial.text}"
                    </p>
                    
                    {/* Customer Info */}
                    <div className="flex items-center">
                      <div className="h-14 w-14 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                        <span className="text-white font-bold text-lg">{testimonial.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{testimonial.name}</p>
                        <p className="text-primary-600 font-semibold">{testimonial.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-emerald-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-3 glass rounded-full px-6 py-3 mb-8 shadow-soft border border-white/30">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="font-semibold">Ready to Start?</span>
            </div>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Transform Your Space
            <span className="block text-yellow-300">Today</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed">
            Join hundreds of satisfied customers in Laredo. Experience professional cleaning 
            with <span className="font-bold text-yellow-300">real-time tracking</span> and <span className="font-bold text-yellow-300">guaranteed satisfaction</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/booking" className="group bg-white text-primary-600 px-10 py-4 rounded-2xl text-xl font-bold hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-white/25 transform hover:-translate-y-1 inline-flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 mr-3 group-hover:animate-bounce" />
              Start Your Journey
              <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
            
            <a href="tel:+19561234567" className="group border-2 border-white text-white px-10 py-4 rounded-2xl text-xl font-bold hover:bg-white hover:text-primary-600 transition-all duration-300 inline-flex items-center justify-center glass">
              <PhoneIcon className="h-6 w-6 mr-3 group-hover:animate-pulse" />
              Call (956) 123-4567
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-14 w-14 bg-gradient-to-br from-primary-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold gradient-text">Sweeper</h3>
                  <p className="text-sm text-gray-400 font-medium">Smart Cleaning Platform</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md mb-6">
                Revolutionizing professional cleaning in Laredo, TX with real-time tracking, 
                instant booking, and guaranteed satisfaction. Your trusted cleaning technology partner.
              </p>
              <div className="flex space-x-4">
                {[
                  { name: 'Facebook', color: 'bg-blue-600 hover:bg-blue-700' },
                  { name: 'Twitter', color: 'bg-sky-600 hover:bg-sky-700' },
                  { name: 'Instagram', color: 'bg-pink-600 hover:bg-pink-700' }
                ].map((social, index) => (
                  <div key={index} className={`w-12 h-12 ${social.color} rounded-xl flex items-center justify-center transition-colors cursor-pointer transform hover:scale-105`}>
                    <span className="text-white font-bold text-sm">{social.name.charAt(0)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6 text-primary-400">Quick Contact</h4>
              <div className="space-y-4">
                <div className="flex items-center group cursor-pointer">
                  <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center mr-3 group-hover:bg-primary-600/30 transition-colors">
                    <PhoneIcon className="h-5 w-5 text-primary-400" />
                  </div>
                  <span className="group-hover:text-primary-400 transition-colors">(956) 123-4567</span>
                </div>
                <div className="flex items-center group">
                  <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center mr-3 group-hover:bg-emerald-600/30 transition-colors">
                    <MapPinIcon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="group-hover:text-emerald-400 transition-colors">Laredo, TX & 25mi radius</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6 text-emerald-400">Services</h4>
              <ul className="space-y-3">
                {['Regular Cleaning', 'Deep Cleaning', 'Airbnb Turnover', 'Office Cleaning', 'Move-in/Move-out'].map((service, index) => (
                  <li key={index} className="text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                &copy; 2024 Sweeper. All rights reserved. Built with ❤️ in Laredo, TX.
              </p>
              <div className="flex space-x-6 text-sm">
                <Link to="/privacy" className="text-gray-400 hover:text-primary-400 transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="text-gray-400 hover:text-primary-400 transition-colors">Terms of Service</Link>
                <span className="text-gray-400">•</span>
                <span className="text-emerald-400 font-semibold">Status: All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}