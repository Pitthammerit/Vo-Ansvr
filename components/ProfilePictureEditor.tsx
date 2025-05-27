"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Upload, Camera, Save, AlertCircle, ZoomIn } from "lucide-react"

interface ProfilePictureEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (imageData: string) => void
  initialImage?: string | null
}

export function ProfilePictureEditor({ isOpen, onClose, onSave, initialImage }: ProfilePictureEditorProps) {
  const [image, setImage] = useState<string | null>(initialImage || null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [baseScale, setBaseScale] = useState(1) // New: stores the base scale for 1.0x
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showCamera, setShowCamera] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [imageLoaded, setImageLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Constants for the circular frame
  const CIRCLE_SIZE = 224 // 56 * 4 = 224px (w-56 h-56)

  // Calculate the base scale to ensure the circle is always completely filled
  const calculateBaseScale = (imgWidth: number, imgHeight: number): number => {
    const aspectRatio = imgWidth / imgHeight

    // Always scale to fill the circle completely (cover behavior)
    // This means we scale to the larger dimension to ensure no empty space
    if (aspectRatio >= 1) {
      // Landscape or square: scale by height to fill circle completely
      return CIRCLE_SIZE / imgHeight
    } else {
      // Portrait: scale by width to fill circle completely
      return CIRCLE_SIZE / imgWidth
    }
  }

  // Handle image load and calculate proper scaling
  const handleImageLoad = () => {
    if (imageRef.current) {
      const img = imageRef.current
      const newBaseScale = calculateBaseScale(img.naturalWidth, img.naturalHeight)

      console.log("Image loaded:", {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        circleSize: CIRCLE_SIZE,
        calculatedBaseScale: newBaseScale,
        scalingStrategy:
          img.naturalWidth >= img.naturalHeight ? "scale by height (landscape)" : "scale by width (portrait)",
      })

      setBaseScale(newBaseScale)
      setScale(1) // Reset to 1.0x which will use the base scale
      setPosition({ x: 0, y: 0 }) // Reset position to center
      setImageLoaded(true)
    }
  }

  // Calculate the actual scale to apply (base scale * user scale)
  const getActualScale = () => {
    return baseScale * scale
  }

  // Calculate the bounds for dragging to prevent empty space
  const getDragBounds = () => {
    if (!imageRef.current) return { minX: 0, maxX: 0, minY: 0, maxY: 0 }

    const img = imageRef.current
    const actualScale = getActualScale()
    const scaledWidth = img.naturalWidth * actualScale
    const scaledHeight = img.naturalHeight * actualScale

    // Calculate how much the image extends beyond the circle
    const overflowX = Math.max(0, (scaledWidth - CIRCLE_SIZE) / 2)
    const overflowY = Math.max(0, (scaledHeight - CIRCLE_SIZE) / 2)

    return {
      minX: -overflowX,
      maxX: overflowX,
      minY: -overflowY,
      maxY: overflowY,
    }
  }

  // Constrain position within bounds
  const constrainPosition = (newX: number, newY: number) => {
    const bounds = getDragBounds()
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, newX)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, newY)),
    }
  }

  // Add global event listeners for drag functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault()
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        const constrainedPos = constrainPosition(newX, newY)
        setPosition(constrainedPos)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        e.preventDefault()
        const touch = e.touches[0]
        const newX = touch.clientX - dragStart.x
        const newY = touch.clientY - dragStart.y
        const constrainedPos = constrainPosition(newX, newY)
        setPosition(constrainedPos)
      }
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, dragStart, baseScale, scale])

  // Update position constraints when scale changes
  useEffect(() => {
    if (imageLoaded) {
      const constrainedPos = constrainPosition(position.x, position.y)
      if (constrainedPos.x !== position.x || constrainedPos.y !== position.y) {
        setPosition(constrainedPos)
      }
    }
  }, [scale, imageLoaded])

  const compressImage = (file: File, maxSizeMB = 2): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions to keep under 2MB
        let { width, height } = img
        const maxDimension = 1200 // Max width/height for 2MB constraint

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width
            width = maxDimension
          } else {
            width = (width * maxDimension) / height
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)

          // Try different quality levels to get under 2MB
          let quality = 0.9
          let dataUrl = canvas.toDataURL("image/jpeg", quality)

          while (dataUrl.length > 2 * 1024 * 1024 * 1.37 && quality > 0.1) {
            // 1.37 accounts for base64 overhead
            quality -= 0.1
            dataUrl = canvas.toDataURL("image/jpeg", quality)
          }

          resolve(dataUrl)
        } else {
          reject(new Error("Could not get canvas context"))
        }
      }

      img.onerror = () => reject(new Error("Could not load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setUploading(true)
    setImageLoaded(false)

    try {
      // Check file size (2MB = 2 * 1024 * 1024 bytes)
      if (file.size > 2 * 1024 * 1024) {
        setError("File size must be less than 2MB. Please choose a smaller image or we'll compress it for you.")
      }

      const compressedImage = await compressImage(file, 2)
      setImage(compressedImage)
      // Reset states - handleImageLoad will set proper values
      setPosition({ x: 0, y: 0 })
      setScale(1)
      setBaseScale(1)
      setShowCamera(false)
    } catch (err) {
      setError("Failed to process image. Please try a different file.")
    } finally {
      setUploading(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowCamera(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      setError("Could not access camera. Please check permissions.")
    }
  }

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      // Set canvas to square aspect ratio for circular crop
      const size = Math.min(video.videoWidth, video.videoHeight)
      canvas.width = size
      canvas.height = size

      if (context) {
        // Draw video frame centered and cropped to square
        const offsetX = (video.videoWidth - size) / 2
        const offsetY = (video.videoHeight - size) / 2

        context.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size)

        const imageData = canvas.toDataURL("image/jpeg", 0.9)
        setImage(imageData)
        setImageLoaded(false)
        // Reset states - handleImageLoad will set proper values
        setPosition({ x: 0, y: 0 })
        setScale(1)
        setBaseScale(1)
        setShowCamera(false)

        // Stop camera stream
        const stream = video.srcObject as MediaStream
        stream?.getTracks().forEach((track) => track.stop())
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
  }

  const resetPosition = () => {
    setPosition({ x: 0, y: 0 })
    setScale(1)
  }

  const handleSave = async () => {
    if (image && canvasRef.current && imageRef.current) {
      setUploading(true)
      try {
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")
        const size = 300

        canvas.width = size
        canvas.height = size

        if (context) {
          // Create circular clip
          context.beginPath()
          context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
          context.clip()

          // Calculate the actual image dimensions and positioning
          const img = imageRef.current
          const scaleFactor = size / CIRCLE_SIZE

          // Scale position and size for final output
          const finalX = position.x * scaleFactor
          const finalY = position.y * scaleFactor
          const finalScale = getActualScale() * scaleFactor

          const scaledWidth = img.naturalWidth * finalScale
          const scaledHeight = img.naturalHeight * finalScale

          // Center the image in the canvas
          const centerX = size / 2
          const centerY = size / 2

          context.drawImage(
            img,
            centerX - scaledWidth / 2 + finalX,
            centerY - scaledHeight / 2 + finalY,
            scaledWidth,
            scaledHeight,
          )

          const croppedImage = canvas.toDataURL("image/jpeg", 0.9)
          onSave(croppedImage)
        }
      } catch (err) {
        setError("Failed to save image. Please try again.")
      } finally {
        setUploading(false)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-black/20 backdrop-blur-xl rounded-lg border border-white w-full max-w-sm">
        <div className="flex items-center justify-between p-4">
          <h3 className="text-lg font-semibold text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
            Edit Profile Picture
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm font-medium" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                {error}
              </p>
            </div>
          )}

          {showCamera ? (
            <div className="space-y-4">
              <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                {/* Circular overlay for camera */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-dashed border-white/50 rounded-full"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={takePicture}
                  className="flex-1 bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-semibold"
                  disabled={uploading}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Picture
                </Button>
                <Button
                  onClick={() => setShowCamera(false)}
                  variant="outline"
                  className="border-[#2DAD71]/30 text-white bg-[#2DAD71]/20 hover:bg-[#2DAD71]/30 font-semibold"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : image ? (
            <div className="space-y-4">
              {/* Streamlined Circular Preview - No Frame */}
              <div className="flex justify-center">
                <div className="relative">
                  {/* Main circular preview */}
                  <div
                    className="relative w-full h-96 rounded-full overflow-hidden bg-gray-700"
                    style={{ aspectRatio: "1/1" }}
                  >
                    <div
                      className={`absolute inset-0 ${isDragging ? "cursor-grabbing" : "cursor-grab"} select-none`}
                      onMouseDown={handleMouseDown}
                      onTouchStart={handleTouchStart}
                      style={{ touchAction: "none" }}
                    >
                      <img
                        ref={imageRef}
                        src={image || "/placeholder.svg"}
                        alt="Profile Preview"
                        className="absolute pointer-events-none select-none"
                        onLoad={handleImageLoad}
                        style={{
                          transform: `translate(${position.x}px, ${position.y}px) scale(${getActualScale()})`,
                          transformOrigin: "center center",
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${getActualScale()})`,
                          maxWidth: "none",
                          maxHeight: "none",
                          width: "auto",
                          height: "auto",
                          opacity: imageLoaded ? 1 : 0,
                          transition: "opacity 0.3s ease-in-out",
                        }}
                        draggable={false}
                      />
                      {/* Loading indicator */}
                      {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reset button at bottom of circle */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
                    <button
                      onClick={resetPosition}
                      className="text-xs text-white/50 hover:text-white/70 transition-colors font-medium pointer-events-auto px-2 py-1 rounded"
                      style={{
                        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Compact Zoom Control - Inline with enhanced text */}
              <div className="flex items-center gap-3 px-2">
                <ZoomIn className="w-4 h-4 text-white" />
                <input
                  type="range"
                  min="0.8"
                  max="4"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(Number.parseFloat(e.target.value))}
                  className="flex-1 h-2 accent-[#2DAD71] bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #2DAD71 0%, #2DAD71 ${((scale - 0.8) / 3.2) * 100}%, #374151 ${((scale - 0.8) / 3.2) * 100}%, #374151 100%)`,
                  }}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1 border-[#2DAD71]/30 text-white bg-[#2DAD71]/20 hover:bg-[#2DAD71]/30 font-semibold"
                  disabled={uploading}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New
                </Button>
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="flex-1 border-[#2DAD71]/30 text-white bg-[#2DAD71]/20 hover:bg-[#2DAD71]/30 font-semibold"
                  disabled={uploading}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-semibold"
                disabled={uploading}
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Picture
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center py-8">
                <div className="w-56 h-56 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <p
                      className="text-gray-200 text-sm font-medium"
                      style={{
                        textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.3)",
                        color: "#374151",
                      }}
                    >
                      No image selected
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-[#2DAD71] hover:bg-[#2DAD71]/90 text-white font-semibold"
                  disabled={uploading}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Picture
                    </>
                  )}
                </Button>
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="flex-1 border-[#2DAD71]/30 text-white bg-[#2DAD71]/20 hover:bg-[#2DAD71]/30 font-semibold"
                  disabled={uploading}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
