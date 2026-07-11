const SUPPORTED_MIME_TYPES = [
  'audio/webm',
  'audio/wav',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
]

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export function validateAudioFile(file: File): string | null {
  if (!file) return 'No file selected.'

  const baseType = file.type.split(';')[0].trim()
  if (!SUPPORTED_MIME_TYPES.includes(baseType)) {
    return `Unsupported file type "${file.type}". Accepted: .webm, .wav, .mp3, .m4a`
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
