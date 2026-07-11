import { parseBuffer } from 'music-metadata'

export async function getAudioDuration(buffer: ArrayBuffer): Promise<number> {
  const metadata = await parseBuffer(Buffer.from(buffer), undefined, {
    duration: true,
  })
  return metadata.format.duration || 0
}
