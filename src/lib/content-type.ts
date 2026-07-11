import { fileTypeFromBuffer } from 'file-type'

const AUDIO_MIMES = new Set([
  'audio/webm',
  'video/webm', // WebM container (can be audio-only)
  'audio/wav',
  'audio/wave',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  'audio/vnd.wav',
])

export async function sniffAudioType(buffer: ArrayBuffer): Promise<{
  valid: boolean
  detectedMime: string | null
  reason?: string
}> {
  const uint8 = new Uint8Array(buffer)
  const result = await fileTypeFromBuffer(uint8)

  if (!result) {
    // No magic bytes detected — reject
    return { valid: false, detectedMime: null, reason: 'Unable to detect file type. The file may be empty or corrupted.' }
  }

  const mime = result.mime.toLowerCase()

  if (!AUDIO_MIMES.has(mime)) {
    return {
      valid: false,
      detectedMime: mime,
      reason: `Detected "${mime}" instead of an audio format. Only audio files (.webm, .wav, .mp3, .m4a) are accepted.`,
    }
  }

  return { valid: true, detectedMime: mime }
}
