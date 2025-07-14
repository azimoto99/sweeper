import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Review, Booking } from '../../types'
import {
  StarIcon,
  ChatBubbleBottomCenterIcon,
  PhotoIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

export function ReviewsPage() {
  const { profile } = useAuthContext()
  const [reviews, setReviews] = useState<Review[]>([])
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    if (!profile) return

    try {
      setLoading(true)
      
      // Fetch user's reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_user_id_fkey(full_name)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError)
      } else {
        setReviews(reviewsData || [])
      }

      // Fetch completed bookings without reviews
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError)
      } else {
        // Filter out bookings that already have reviews
        const reviewedBookingIds = reviews.map(r => r.booking_id)
        const unreviewed = (bookingsData || []).filter(b => !reviewedBookingIds.includes(b.id))
        setCompletedBookings(unreviewed)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async (bookingId: string, rating: number, comment: string) => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: profile.id,
          booking_id: bookingId,
          rating,
          comment: comment || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Refresh data
      fetchData()
      setShowReviewForm(false)
      setSelectedBooking(null)
    } catch (error) {
      console.error('Error submitting review:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reviews & Feedback</h1>
        <p className="text-gray-600 mt-2">Share your experience and help us improve our services</p>
      </div>

      {/* Pending Reviews */}
      {completedBookings.length > 0 && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-6 w-6 text-yellow-600 mr-3" />
            <h2 className="text-lg font-semibold text-yellow-900">
              Pending Reviews ({completedBookings.length})
            </h2>
          </div>
          <p className="text-yellow-800 mb-4">
            You have completed services that haven't been reviewed yet. Your feedback helps us improve!
          </p>
          <div className="space-y-3">
            {completedBookings.slice(0, 3).map(booking => (
              <div key={booking.id} className="flex items-center justify-between bg-white p-4 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {booking.service_type.replace('_', ' ').toUpperCase()} Cleaning
                  </h3>
                  <p className="text-sm text-gray-600">
                    {booking.scheduled_date} • ${booking.price}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedBooking(booking)
                    setShowReviewForm(true)
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                >
                  Write Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && selectedBooking && (
        <ReviewForm
          booking={selectedBooking}
          onSubmit={submitReview}
          onCancel={() => {
            setShowReviewForm(false)
            setSelectedBooking(null)
          }}
        />
      )}

      {/* Existing Reviews */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Reviews</h2>
        
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleBottomCenterIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600">
              Complete a service to leave your first review and help us improve!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewForm({ 
  booking, 
  onSubmit, 
  onCancel 
}: { 
  booking: Booking
  onSubmit: (bookingId: string, rating: number, comment: string) => void
  onCancel: () => void 
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating > 0) {
      onSubmit(booking.id, rating, comment)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
        
        <div className="mb-4">
          <h4 className="font-medium text-gray-900">
            {booking.service_type.replace('_', ' ').toUpperCase()} Cleaning
          </h4>
          <p className="text-sm text-gray-600">
            {booking.scheduled_date} • ${booking.price}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <StarIcon
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Tell us about your experience..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center mb-2">
            {[1, 2, 3, 4, 5].map(star => (
              <StarIcon
                key={star}
                className={`h-5 w-5 ${
                  star <= review.rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {review.rating}/5 stars
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {new Date(review.created_at).toLocaleDateString()}
          </p>
        </div>
        <CheckCircleIcon className="h-6 w-6 text-green-500" />
      </div>

      {review.comment && (
        <p className="text-gray-700 mb-4">{review.comment}</p>
      )}

      <div className="text-sm text-gray-500">
        Service reviewed
      </div>
    </div>
  )
}
