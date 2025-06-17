import React, { useState, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ItemData {
  name: string
  price: number
  description: string
  condition: string
}

export default function ImageUploadForm() {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [item, setItem] = useState<ItemData | null>(null)

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selectedFiles = Array.from(e.target.files)
    const combined = [...files, ...selectedFiles]
    const limited = combined.slice(0, 4)
    setFiles(limited)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (files.length === 0) {
      alert('Please select at least one image file.')
      return
    }

    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })
    formData.append('description', description)

    try {
      setUploading(true)
      const response = await fetch('/api/hello', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error('Upload failed')

      // parse the wrapper JSON
      const wrapper = (await response.json()) as { message: string }
      // parse the inner message string to our ItemData
      const parsedItem = JSON.parse(wrapper.message) as ItemData
      setItem(parsedItem)
    } catch (error) {
      console.error(error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (item) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4 text-center">Upload Complete!</h2>
          <div className="space-y-4">
            <div className="flex space-x-4 overflow-x-auto">
              {previews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Preview ${idx + 1}`}
                  className="w-24 h-24 object-cover rounded"
                />
              ))}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{item.name}</h3>
              <p className="text-lg font-medium text-green-600">${item.price}</p>
            </div>
            <div>
              <h4 className="font-semibold">Description</h4>
              <p>{item.description}</p>
            </div>
            <div>
              <h4 className="font-semibold">Condition</h4>
              <p>{item.condition}</p>
            </div>
            <div className="text-center">
              <Button type="button" onClick={() => window.location.reload()}>
                Upload Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-4 text-center">Welcome to AutoFBM. Upload your details!</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="images">Upload Images (max 4)</Label>
            <input
              id="images"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              onClick={() => document.getElementById('images')?.click()}
              className="bg-black text-white mt-2"
              disabled={uploading || files.length >= 4}
            >
              {files.length >= 4 ? 'Limit Reached' : 'Choose Files'}
            </Button>
          </div>

          {previews.length > 0 && (
            <div className="flex space-x-4 overflow-x-auto py-2">
              {previews.map((src, idx) => (
                <div key={idx} className="relative flex-shrink-0 w-24 h-24">
                  <img
                    src={src}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-white bg-opacity-75 rounded-full p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter a description..."
              rows={4}
            />
          </div>

          <div className="text-center">
            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? 'Uploading...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
