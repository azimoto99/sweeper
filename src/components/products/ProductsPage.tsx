import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Product } from '../../types'
import { ShoppingCartIcon, StarIcon } from '@heroicons/react/24/outline'

// Mock products for MVP
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'All-Purpose Cleaner',
    description: 'Professional-grade all-purpose cleaner safe for all surfaces',
    price: 12.99,
    inventory: 50,
    image_url: 'https://via.placeholder.com/300x300?text=All-Purpose+Cleaner',
    category: 'Cleaners',
    active: true
  },
  {
    id: '2',
    name: 'Microfiber Cloth Set',
    description: 'Set of 6 premium microfiber cloths for streak-free cleaning',
    price: 19.99,
    inventory: 30,
    image_url: 'https://via.placeholder.com/300x300?text=Microfiber+Cloths',
    category: 'Tools',
    active: true
  },
  {
    id: '3',
    name: 'Glass Cleaner',
    description: 'Streak-free glass and mirror cleaner',
    price: 8.99,
    inventory: 25,
    image_url: 'https://via.placeholder.com/300x300?text=Glass+Cleaner',
    category: 'Cleaners',
    active: true
  },
  {
    id: '4',
    name: 'Disinfectant Spray',
    description: 'Hospital-grade disinfectant spray kills 99.9% of germs',
    price: 15.99,
    inventory: 40,
    image_url: 'https://via.placeholder.com/300x300?text=Disinfectant',
    category: 'Cleaners',
    active: true
  },
  {
    id: '5',
    name: 'Vacuum Bags (Pack of 10)',
    description: 'Universal vacuum bags compatible with most models',
    price: 24.99,
    inventory: 20,
    image_url: 'https://via.placeholder.com/300x300?text=Vacuum+Bags',
    category: 'Supplies',
    active: true
  },
  {
    id: '6',
    name: 'Rubber Gloves',
    description: 'Durable rubber gloves for cleaning protection',
    price: 6.99,
    inventory: 60,
    image_url: 'https://via.placeholder.com/300x300?text=Rubber+Gloves',
    category: 'Tools',
    active: true
  }
]

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // For MVP, use mock data
      setProducts(MOCK_PRODUCTS)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[productId] > 1) {
        newCart[productId]--
      } else {
        delete newCart[productId]
      }
      return newCart
    })
  }

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0)
  }

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((sum, [productId, count]) => {
      const product = products.find(p => p.id === productId)
      return sum + (product ? product.price * count : 0)
    }, 0)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cleaning Products</h1>
          <p className="text-gray-600 mt-2">Professional-grade cleaning supplies for your home</p>
        </div>
        
        {getTotalItems() > 0 && (
          <div className="bg-primary-600 text-white px-4 py-2 rounded-lg">
            <ShoppingCartIcon className="inline h-5 w-5 mr-2" />
            {getTotalItems()} items - ${getTotalPrice().toFixed(2)}
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex space-x-4">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="aspect-w-1 aspect-h-1">
              <img
                src={product.image_url || 'https://via.placeholder.com/300x300?text=Product'}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{product.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-primary-600">${product.price}</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">(4.8)</span>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                {product.inventory > 0 ? (
                  <span className="text-green-600">In stock ({product.inventory} available)</span>
                ) : (
                  <span className="text-red-600">Out of stock</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {cart[product.id] ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 bg-gray-100 rounded-md min-w-[3rem] text-center">
                      {cart[product.id]}
                    </span>
                    <button
                      onClick={() => addToCart(product.id)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(product.id)}
                    disabled={product.inventory === 0}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {getTotalItems() > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-6 max-w-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shopping Cart</h3>
          <div className="space-y-2 mb-4">
            {Object.entries(cart).map(([productId, count]) => {
              const product = products.find(p => p.id === productId)
              if (!product) return null
              
              return (
                <div key={productId} className="flex justify-between text-sm">
                  <span>{product.name} x{count}</span>
                  <span>${(product.price * count).toFixed(2)}</span>
                </div>
              )
            })}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between font-semibold mb-4">
              <span>Total:</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
