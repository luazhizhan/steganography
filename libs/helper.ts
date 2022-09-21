export type Bits = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type Data = string | null

export type Payloads = 'message' | 'file'

export type PayloadMineTypes =
  | null
  | 'image/png'
  | 'image/jpg'
  | 'image/jpeg'
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export const acceptSource = {
  'image/png': [],
  'image/bmp': [],
}

export function mineTypeToExt(mineType: PayloadMineTypes): string {
  switch (mineType) {
    case 'image/png':
      return 'png'
    case 'image/jpg':
      return 'jpg'
    case 'image/jpeg':
      return 'jpeg'
    case 'application/pdf':
      return 'pdf'
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return 'pptx'
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx'
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'xlsx'
    default:
      return ''
  }
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
