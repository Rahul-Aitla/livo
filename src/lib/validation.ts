const SUPPORTED_EXTENSIONS = ['.webm', '.wav', '.mp3', '.m4a']
const SUPPORTED_MIME_PREFIXES = ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/ogg']

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export function validateAudioFile(file: File): string | null {
  if (!file) return 'No file selected.'
  if (file.size === 0) return 'Empty file. Choose a valid audio file.'

  const baseType = file.type.split(';')[0].trim().toLowerCase()

  // Check MIME type if available
  if (baseType) {
    const isSupportedMime = SUPPORTED_MIME_PREFIXES.some((p) => baseType.startsWith(p))
    if (!isSupportedMime) {
      const ext = getExtension(file.name)
      return `Unsupported file type "${file.type || ext}". Accepted: .webm, .wav, .mp3, .m4a`
    }
  } else {
    // No MIME type — check extension
    const ext = getExtension(file.name)
    if (!ext || !SUPPORTED_EXTENSIONS.includes(ext.toLowerCase())) {
      return `Unsupported file. Accepted: .webm, .wav, .mp3, .m4a`
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File too large (max 10 MB).`
  }

  return null
}

export function validateDuration(durationSeconds: number): string | null {
  if (durationSeconds < 30) {
    return `Audio is too short (${Math.round(durationSeconds)}s). Must be between 30 and 45 seconds.`
  }
  if (durationSeconds > 45) {
    return `Audio is too long (${Math.round(durationSeconds)}s). Must be between 30 and 45 seconds.`
  }
  return null
}

function getExtension(filename: string): string {
  const i = filename.lastIndexOf('.')
  return i >= 0 ? filename.slice(i) : ''
}
