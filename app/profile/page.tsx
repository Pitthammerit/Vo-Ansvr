"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, Mail, Save, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { ProfilePictureEditor } from "@/components/ProfilePictureEditor"

export default function ProfilePage() {
  const router = useRouter()
  const { user, updateProfile, updatePassword, loading: authLoading } = useAuth()

  const [name, setName] = useState(user?.user_metadata?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [success, setSuccess] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.user_metadata?.avatar_url || null)
  const [showProfileEditor, setShowProfileEditor] = useState(false)

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || "")
      setEmail(user.email || "")
      setAvatarPreview(user.user_metadata?.avatar_url || null)
    }
  }, [user])

  // Clear errors when inputs change
  useEffect(() => {
    if (error) setError("")
  }, [name, email])

  useEffect(() => {
    if (passwordError) setPasswordError("")
  }, [currentPassword, newPassword, confirmPassword])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Add debugging
    console.log("🔍 Profile Update Debug:", {
      name,
      email,
      avatarPreview,
      user: user?.id,
      timestamp: new Date().toISOString(),
    })

    try {
      const updateData = {
        name,
        email,
        avatar_url: avatarPreview,
      }

      console.log("📤 Sending update data:", updateData)

      const { error } = await updateProfile(updateData)

      console.log("📥 Update response:", { error })

      if (error) {
        console.error("❌ Profile update error:", error)
        setError(error.message)
      } else {
        console.log("✅ Profile update successful")
        setSuccess("Profile updated successfully!")
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long")
      return
    }

    setPasswordLoading(true)

    try {
      const { error } = await updatePassword(newPassword)

      if (error) {
        setPasswordError(error.message)
      } else {
        setPasswordSuccess("Password updated successfully!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")

        // Clear success message after 3 seconds
        setTimeout(() => setPasswordSuccess(""), 3000)
      }
    } catch (err) {
      setPasswordError("Failed to change password. Please try again.")
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleAvatarSave = async (imageData: string) => {
    console.log("🖼️ Avatar Save Debug:", {
      imageDataLength: imageData.length,
      imageDataPreview: imageData.substring(0, 50) + "...",
      currentName: name,
      currentEmail: email,
    })

    setAvatarPreview(imageData)
    setShowProfileEditor(false)

    // Auto-save the avatar
    try {
      const updateData = {
        name,
        email,
        avatar_url: imageData,
      }

      console.log("📤 Auto-saving avatar with data:", updateData)

      const { error } = await updateProfile(updateData)

      console.log("📥 Avatar save response:", { error })

      if (error) {
        console.error("❌ Avatar save error:", error)
        setError("Failed to save profile picture")
      } else {
        console.log("✅ Avatar saved successfully")
        setSuccess("Profile picture updated!")
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (err) {
      console.error("❌ Avatar save unexpected error:", err)
      setError("Failed to save profile picture")
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="text-white font-bold text-xl">
                ANS/R<span className="text-red-500">.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-gray-400">Manage your account information and preferences</p>
          </div>

          {/* Global Success/Error Messages */}
          {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-green-900/20 border border-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Information */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">My Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="flex flex-col items-center mb-6">
                    <button
                      type="button"
                      onClick={() => setShowProfileEditor(true)}
                      className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mb-4 hover:opacity-80 transition-opacity"
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview || "/placeholder.svg"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProfileEditor(true)}
                      className="text-sm text-[#2DAD71] hover:text-[#2DAD71]/80 transition-colors"
                    >
                      Change Profile
                    </button>
                  </div>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 border border-gray-600 focus:border-[#2DAD71] focus:outline-none"
                      style={{ borderRadius: "6px" }}
                      required
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 border border-gray-600 focus:border-[#2DAD71] focus:outline-none"
                      style={{ borderRadius: "6px" }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || authLoading}
                    className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 disabled:bg-gray-600 text-white font-semibold py-3 px-6 transition-all flex items-center justify-center gap-2"
                    style={{ borderRadius: "6px" }}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Profile
                      </>
                    )}
                  </button>
                </form>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-gray-800 text-white pl-4 pr-12 py-3 border border-gray-600 focus:border-[#2DAD71] focus:outline-none"
                      style={{ borderRadius: "6px" }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-gray-800 text-white pl-4 pr-12 py-3 border border-gray-600 focus:border-[#2DAD71] focus:outline-none"
                      style={{ borderRadius: "6px" }}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-gray-800 text-white pl-4 pr-12 py-3 border border-gray-600 focus:border-[#2DAD71] focus:outline-none"
                      style={{ borderRadius: "6px" }}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {passwordError && (
                    <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-400 text-sm">{passwordError}</p>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="bg-green-900/20 border border-green-700 p-3 rounded-lg flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      <p className="text-green-400 text-sm">{passwordSuccess}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={passwordLoading || authLoading}
                    className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90 disabled:bg-gray-600 text-white font-semibold py-3 px-6 transition-all flex items-center justify-center gap-2"
                    style={{ borderRadius: "6px" }}
                  >
                    {passwordLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Changing...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Change Password
                      </>
                    )}
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        <ProfilePictureEditor
          isOpen={showProfileEditor}
          onClose={() => setShowProfileEditor(false)}
          onSave={handleAvatarSave}
          initialImage={avatarPreview}
        />
      </div>
    </AuthGuard>
  )
}
