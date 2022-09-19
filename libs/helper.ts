export type Bits = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type Data = string | null

export const accept = {
  'image/png': [],
  'image/bmp': [],
}

export async function blobToBase64(blob: Blob): Promise<string | Error> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('result is not a Base64 string'))
      }
      resolve(reader.result)
    }
    reader.readAsDataURL(blob)
  })
}
