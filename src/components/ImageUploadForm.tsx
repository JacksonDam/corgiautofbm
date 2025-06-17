import React, { useState, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function ImageUploadForm() {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)

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
      const response = await fetch('http://localhost:5000/api/hello', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error('Upload failed')
      const data = await response.json()
      console.log('Success:', data)
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
    }
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
