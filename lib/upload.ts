import { getSupabaseBrowserClient } from "./supabase/client"

export async function uploadProductImage(file: File, productId: string): Promise<string> {
  try {
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size must be less than 5MB")
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Only JPEG, PNG, and WebP images are allowed")
    }

    const supabase = getSupabaseBrowserClient()

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${productId}-${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("images").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Upload error:", error)
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error("Error uploading image:", error)
    throw new Error("Failed to upload image")
  }
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient()

    // Extract file path from URL
    const urlParts = imageUrl.split("/images/")
    if (urlParts.length < 2) return

    const filePath = urlParts[1]

    await supabase.storage.from("images").remove([filePath])
  } catch (error) {
    console.error("Error deleting image:", error)
  }
}
