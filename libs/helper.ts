export type Bits = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type Data = string | null

export type NumData = number | null

export type SourceMimeTypes =
  | 'image/png'
  | 'image/jpg'
  | 'image/jpeg'
  | 'image/bmp'
  | 'image/tiff'
  | 'video/x-msvideo'
  | 'video/mp4'
  | 'audio/wav'
  | 'audio/mpeg'
  | 'text/plain'

export type Payloads = 'message' | 'file'

export type PayloadMimeTypes =
  | null
  | 'image/png'
  | 'image/jpg'
  | 'image/jpeg'
  | 'image/bmp'
  | 'image/tiff'
  | 'video/x-msvideo'
  | 'video/mp4'
  | 'audio/wav'
  | 'audio/mpeg'
  | 'text/plain'
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export const acceptSource = {
  'image/png': [],
  'image/bmp': [],
  'image/jpeg': [],
  'image/jpg': [],
  'image/tiff': ['.tiff', '.tif'],
  'audio/wav': [],
  'audio/mpeg': [],
  'video/x-msvideo': ['.avi'],
  'video/mp4': ['.mp4'],
  'text/plain': [],
}

export function payloadMimeTypeToExt(mimeType: PayloadMimeTypes): string {
  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/jpg':
      return 'jpg'
    case 'image/jpeg':
      return 'jpeg'
    case 'image/bmp':
      return 'bmp'
    case 'image/tiff':
      return 'tiff'
    case 'text/plain':
      return 'txt'
    case 'application/pdf':
      return 'pdf'
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return 'pptx'
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx'
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'xlsx'
    case 'audio/wav':
      return 'wav'
    case 'audio/mpeg':
      return 'mp3'
    case 'video/x-msvideo':
      return 'avi'
    case 'video/mp4':
      return 'mp4'
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
