import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { hasSupabaseConfig } from '../../lib/supabase'
import { uploadImageAsset } from '../../services/cms'

interface Props {
  value?: string
  onChange: (url: string) => void
  label?: string
  maxSizeMB?: number
  accept?: string
}

const ACCEPT_DEFAULT = 'image/png,image/jpeg,image/webp,image/gif'

export function ImageUploader({ value, onChange, label = 'Image', maxSizeMB = 5, accept = ACCEPT_DEFAULT }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file: File) {
    setError('')
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Max ${maxSizeMB}MB.`)
      return
    }
    if (!hasSupabaseConfig) {
      // Local preview only in demo mode.
      const reader = new FileReader()
      reader.onload = () => onChange(String(reader.result ?? ''))
      reader.readAsDataURL(file)
      return
    }
    setUploading(true)
    try {
      const url = await uploadImageAsset(file)
      onChange(url)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void handleFile(file)
    event.target.value = ''
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <div className="image-uploader" style={{ display: 'grid', gap: 10 }}>
      <span className="field-label" style={{ fontWeight: 600 }}>{label}</span>
      <div
        onDragOver={(event) => { event.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--warm)' : 'var(--line)'}`,
          borderRadius: 12,
          padding: 20,
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(132, 104, 77, 0.06)' : 'transparent',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        role="button"
        aria-label={`Upload ${label.toLowerCase()}`}
        tabIndex={0}
      >
        {value ? (
          <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
            <img src={value} alt={label} style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, objectFit: 'cover' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn ghost"
                onClick={(event) => { event.stopPropagation(); inputRef.current?.click() }}
              >
                <ImagePlus size={14} /> Replace
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={(event) => { event.stopPropagation(); onChange('') }}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
            {uploading ? <Loader2 size={28} className="spin" /> : <UploadCloud size={28} />}
            <p style={{ margin: 0 }}>
              {uploading ? 'Uploading…' : 'Drag and drop an image, or click to browse'}
            </p>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>PNG · JPG · WebP · up to {maxSizeMB}MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={onInputChange}
        />
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
    </div>
  )
}
