// src/utils/imageUpload.ts

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY as string
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DIMENSION = 800 // px
const JPEG_QUALITY = 0.8

export interface UploadResult {
  url: string
  deleteUrl: string
}

export interface UploadError {
  message: string
  code: 'VALIDATION' | 'UPLOAD' | 'NETWORK'
}

/**
 * Validate file type and size before upload
 */
export function validateImageFile(file: File): UploadError | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (!allowedTypes.includes(file.type)) {
    return {
      message: 'Tipo de archivo no válido. Usa JPG, PNG o WebP.',
      code: 'VALIDATION',
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      message: `La imagen pesa ${sizeMB}MB. El máximo es 5MB.`,
      code: 'VALIDATION',
    }
  }

  return null
}

/**
 * Compress and resize image using canvas
 */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Resize if too large
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo crear el canvas'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Error al comprimir la imagen'))
          }
        },
        'image/jpeg',
        JPEG_QUALITY,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Error al cargar la imagen'))
    }

    img.src = url
  })
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Remove the data:image/xxx;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Upload image to ImgBB
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  if (!IMGBB_API_KEY) {
    throw {
      message: 'API key no configurada. Contacta al administrador.',
      code: 'UPLOAD' as const,
    }
  }

  // Validate
  const validationError = validateImageFile(file)
  if (validationError) {
    throw validationError
  }

  try {
    // Compress
    const compressedBlob = await compressImage(file)
    const base64 = await blobToBase64(compressedBlob)

    // Upload
    const formData = new FormData()
    formData.append('key', IMGBB_API_KEY)
    formData.append('image', base64)
    formData.append('expiration', '0') // Never expire

    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw {
        message: 'Error al subir la imagen. Intenta de nuevo.',
        code: 'UPLOAD' as const,
      }
    }

    const data = await response.json()

    if (!data.success) {
      throw {
        message: data.error?.message || 'Error al subir la imagen.',
        code: 'UPLOAD' as const,
      }
    }

    return {
      url: data.data.url,
      deleteUrl: data.data.delete_url,
    }
  } catch (error: unknown) {
    // Re-throw structured errors
    if (error && typeof error === 'object' && 'code' in error) {
      throw error
    }

    // Network or unknown errors
    throw {
      message: 'Error de conexión. Verifica tu internet.',
      code: 'NETWORK' as const,
    }
  }
}
