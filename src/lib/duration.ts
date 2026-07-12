import { parseBuffer } from 'music-metadata'

// NOTE: parseBuffer reads the full buffer. The same buffer is later passed
// to transcribeAudio() which converts it again to Readable. For large files
// this is a double scan of the entire buffer — a minor overhead since the
// buffer is already in memory and files are capped at 10 MB.
export async function getAudioDuration(buffer: ArrayBuffer): Promise<number> {
  const metadata = await parseBuffer(Buffer.from(buffer), undefined, {
    duration: true,
  })
  return metadata.format.duration || 0
}
