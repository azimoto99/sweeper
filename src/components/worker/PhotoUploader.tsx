import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useNotify } from '../../hooks/useNotify'
import {
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface PhotoUploaderProps {
  bookingId: string
  workerId: string
  onPhotosUploaded?: (photos: string[]) => void
  maxPhotos?: number
  type: 'before' | 'after' | 'progress'
}

interface UploadedPhoto {
  id: string
  url: string
  publicUrl: string
  type: 'before' | 'after' | 'progress'
  uploading?: boolean
}

export function PhotoUploader({ 
  bookingId, 
  workerId, 
  onPhotosUploaded, 
  maxPhotos = 5,
  type 
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const notify = useNotify()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (photos.length + files.length > maxPhotos) {
      notify.error(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`)
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`)
        }

        // Create unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${bookingId}/${type}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('job-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('job-photos')
          .getPublicUrl(fileName)

        return {
          id: data.path,
          url: data.path,
          publicUrl,
          type
        }
      })

      const uploadedPhotos = await Promise.all(uploadPromises)
      
      // Save photo records to database
      const photoRecords = uploadedPhotos.map(photo => ({
        booking_id: bookingId,
        worker_id: workerId,
        photo_url: photo.publicUrl,
        photo_type: type,
        storage_path: photo.url
      }))

      const { error: dbError } = await supabase
        .from('job_photos')
        .insert(photoRecords)

      if (dbError) {
        // If database insert fails, clean up uploaded files
        await Promise.all(uploadedPhotos.map(photo => 
          supabase.storage.from('job-photos').remove([photo.url])
        ))
        throw dbError
      }

      setPhotos(prev => [...prev, ...uploadedPhotos])
      onPhotosUploaded?.(uploadedPhotos.map(p => p.publicUrl))
      notify.success(`${uploadedPhotos.length} photo(s) uploaded successfully`)

    } catch (error: any) {
      console.error('Error uploading photos:', error)
      notify.error(error.message || 'Failed to upload photos')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async (photo: UploadedPhoto) => {
    try {
      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from('job-photos')
        .remove([photo.url])

      if (storageError) throw storageError

      // Remove from database
      const { error: dbError } = await supabase
        .from('job_photos')
        .delete()
        .eq('storage_path', photo.url)

      if (dbError) throw dbError

      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      notify.success('Photo removed')

    } catch (error: any) {
      console.error('Error removing photo:', error)
      notify.error('Failed to remove photo')
    }
  }

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment')
      fileInputRef.current.click()
    }
  }

  const openGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture')
      fileInputRef.current.click()
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'before': return 'Before Photos'
      case 'after': return 'After Photos'
      case 'progress': return 'Progress Photos'
      default: return 'Photos'
    }
  }

  const getTypeColor = () => {
    switch (type) {
      case 'before': return 'blue'
      case 'after': return 'green'
      case 'progress': return 'purple'
      default: return 'gray'
    }
  }

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{getTypeLabel()}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colorClasses[getTypeColor() as keyof typeof colorClasses]}`}>
          {photos.length}/{maxPhotos}
        </span>
      </div>

      {/* Upload Buttons */}
      {photos.length < maxPhotos && (
        <div className="flex space-x-3">
          <button
            onClick={openCamera}
            disabled={uploading}
            className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CameraIcon className="h-5 w-5 mr-2" />
            Take Photo
          </button>
          <button
            onClick={openGallery}
            disabled={uploading}
            className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PhotoIcon className="h-5 w-5 mr-2" />
            Gallery
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Progress */}
      {uploading && (
        <div className="flex items-center justify-center py-4">
          <ArrowUpTrayIcon className="h-5 w-5 text-blue-500 animate-bounce mr-2" />
          <span className="text-sm text-gray-600">Uploading photos...</span>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={photo.publicUrl}
                  alt={`${type} photo`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              {/* Remove Button */}
              <button
                onClick={() => handleRemovePhoto(photo)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>

              {/* Upload Success Indicator */}
              <div className="absolute bottom-2 right-2 p-1 bg-green-500 text-white rounded-full">
                <CheckCircleIcon className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && !uploading && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600">No {type} photos yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Tap the buttons above to add photos
          </p>
        </div>
      )}
    </div>
  )
}