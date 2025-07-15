import React from 'react'
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
  CurrencyDollarIcon
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
  return (
    <div className="min-h-screen bg-white scroll-smooth">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Margarita's Cleaning Services</h1>
                <p className="text-sm text-gray-500">Professional Cleaning in Laredo, TX</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#services" className="text-gray-600 hover:text-blue-600 transition-colors">Services</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Reviews</a>
              <a href="tel:+19561234567" className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                <PhoneIcon className="h-4 w-4 mr-1" />
                (956) 123-4567
              </a>
              <Link
                to="/booking"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Book Now
              </Link>
            </div>
            <div className="md:hidden">
              <Link
                to="/booking"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Professional Cleaning Services
              <span className="block text-blue-600">in Laredo, TX</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the difference with Margarita's Cleaning Services. We provide reliable, 
              thorough, and affordable cleaning solutions for your home or business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/booking"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                <CalendarIcon className="h-5 w-5 mr-2" />
                Book Online Now
              </Link>
              <a
                href="tel:+1234567890"
                className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors inline-flex items-center justify-center"
              >
                <PhoneIcon className="h-5 w-5 mr-2" />
                Call (956) 123-4567
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <MapPinIcon className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Serving Laredo & Surrounding Areas</h2>
          </div>
          <p className="text-blue-100">
            We proudly serve a 25-mile radius around Laredo, Texas. Same-day and next-day service available.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From regular house cleaning to deep cleans and commercial services, 
              we have the right solution for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                <service.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4 min-h-[3rem]">{service.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">{service.price}</span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{service.duration}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/booking"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors inline-block text-center font-medium"
                >
                  Choose This Service
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/booking"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              Get Your Free Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Margarita's?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just another cleaning service. We're your neighbors, committed to 
              making your life easier with reliable, professional cleaning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {WHY_CHOOSE_US.map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600">
              Don't just take our word for it - hear from satisfied customers across Laredo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100 relative">
                <div className="absolute top-4 right-4">
                  <svg className="h-8 w-8 text-blue-100" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4.001v10h-10.001z"/>
                  </svg>
                </div>
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Experience the Difference?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of satisfied customers in Laredo. Book your cleaning service today 
            and see why we're the most trusted name in professional cleaning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              Book Your Service
            </Link>
            <a
              href="tel:+1234567890"
              className="border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
            >
              <PhoneIcon className="h-5 w-5 mr-2" />
              Call Now
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Margarita's Cleaning</h3>
              </div>
              <p className="text-gray-400">
                Professional cleaning services in Laredo, TX and surrounding areas. 
                Your satisfaction is our guarantee.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  <span>(956) 123-4567</span>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  <span>Serving Laredo, TX & 25-mile radius</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Regular House Cleaning</li>
                <li>Deep Cleaning</li>
                <li>Airbnb Cleaning</li>
                <li>Office Cleaning</li>
                <li>Move In/Out Cleaning</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Margarita's Cleaning Services. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}