import { ChangeEvent, useReducer } from 'react'
import BitsSelect from '../components/BitsSelect'
import Dropzone from '../components/Dropzone'
import PayloadViewer from '../components/PayloadViewer'
import SourceViewer from '../components/SourceViewer'
import {
  acceptSource,
  Bits,
  blobToBase64,
  Data,
  NumData,
  PayloadMimeTypes,
  payloadMimeTypeToExt,
  Payloads,
  SourceMimeTypes,
} from '../helper'
import styles from './Decode.module.css'

type State = {
  payload: {
    type: Payloads
    mimeType: PayloadMimeTypes
    size: NumData
    name: Data
    bits: Bits
    data: Data
  }
  source: {
    mimeType: SourceMimeTypes
    name: Data
    data: Data
  }
  loading: boolean
}

type Action =
  | { type: 'SET_BITS'; bits: Bits }
  | { type: 'SET_PAYLOAD_TYPE'; payloadType: Payloads }
  | { type: 'SET_PAYLOAD_MIME_TYPE'; mimeType: PayloadMimeTypes }
  | {
      type: 'SET_PAYLOAD_DATA'
      name: Data
      data: Data
      mimeType: PayloadMimeTypes
    }
  | { type: 'SET_PAYLOAD_SIZE'; size: NumData }
  | {
      type: 'SET_SOURCE_DATA'
      mimeType: SourceMimeTypes
      data: Data
      name: string
    }
  | { type: 'CLEAR' }
  | { type: 'SET_LOADING'; loading: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_BITS': {
      return {
        ...state,
        payload: {
          ...state.payload,
          bits: action.bits,
        },
      }
    }
    case 'SET_PAYLOAD_TYPE': {
      return {
        ...state,
        payload: {
          ...state.payload,
          type: action.payloadType,
          data: null,
          mimeType: action.payloadType === 'file' ? 'image/png' : null,
        },
      }
    }
    case 'SET_PAYLOAD_MIME_TYPE': {
      return {
        ...state,
        payload: {
          ...state.payload,
          mimeType: action.mimeType,
        },
      }
    }
    case 'SET_PAYLOAD_SIZE': {
      return {
        ...state,
        payload: {
          ...state.payload,
          size: action.size,
        },
      }
    }
    case 'SET_PAYLOAD_DATA': {
      return {
        ...state,
        payload: {
          ...state.payload,
          data: action.data,
          name: action.name,
          mimeType: action.mimeType,
        },
      }
    }
    case 'SET_SOURCE_DATA': {
      return {
        ...state,
        source: {
          ...state.source,
          name: action.name,
          data: action.data,
          mimeType: action.mimeType,
        },
      }
    }

    case 'CLEAR': {
      return {
        ...state,
        payload: {
          ...state.payload,
          data: null,
        },
        source: {
          ...state.source,
          name: null,
          data: null,
        },
      }
    }
    case 'SET_LOADING': {
      return {
        ...state,
        loading: action.loading,
      }
    }
  }
}

function Decode(): JSX.Element {
  const [state, dispatch] = useReducer(reducer, {
    payload: {
      type: 'message',
      bits: 1,
      size: null,
      data: null,
      mimeType: null,
      name: null,
    },
    source: { mimeType: 'image/png', name: null, data: null },
    loading: false,
  })

  const onBitsChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    dispatch({ type: 'SET_BITS', bits: parseInt(e.target.value) as Bits })
  }

  const onMimeTypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    dispatch({
      type: 'SET_PAYLOAD_MIME_TYPE',
      mimeType: e.target.value as PayloadMimeTypes,
    })
  }

  const onPayloadSizeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const size = ((): number | null => {
      if (!e.target.value.match(/^[1-9][0-9]*$/g)) return null
      return parseInt(e.target.value)
    })()
    dispatch({ type: 'SET_PAYLOAD_SIZE', size })
  }

  const decodeApiEndpoint = (mineType: SourceMimeTypes): string => {
    switch (mineType) {
      case 'image/png':
        return 'from-image'
      case 'image/jpg':
        return 'from-image'
      case 'image/jpeg':
        return 'from-image'
      case 'image/bmp':
        return 'from-image'
      case 'audio/wav':
        return 'from-wav'
      case 'audio/mpeg':
        return 'from-mp3'
      case 'text/plain':
        return 'from-text'
    }
  }

  const onDecode = async (): Promise<void> => {
    if (!state.source.data) return alert('Please select an image')

    try {
      dispatch({ type: 'SET_LOADING', loading: true })

      // Convert base64 to blob
      const convertRes = await fetch(state.source.data)
      const file = await convertRes.blob()

      // Decode image
      const bodyData = new FormData()
      bodyData.append('lsb', state.payload.bits.toString())
      bodyData.append('file', file)
      bodyData.append('mimeType', state.payload.mimeType || '')
      bodyData.append('recoverSize', state.payload.size?.toString() || '0')
      const endpoint = decodeApiEndpoint(state.source.mimeType)
      const decodeRes = await fetch(`/api/decode/${endpoint}`, {
        method: 'POST',
        body: bodyData,
      })

      // Error in decoding
      if (!decodeRes.ok) {
        const error = await decodeRes.json()
        return alert(error.message)
      }

      // Get data according to payload mime type
      const data = await (async () => {
        if (!state.payload.mimeType) {
          const json = await decodeRes.json()
          return json.message as string
        }
        const receiveFile = await decodeRes.blob()
        return blobToBase64(receiveFile)
      })()
      if (data instanceof Error) return

      dispatch({
        type: 'SET_PAYLOAD_DATA',
        mimeType: state.payload.mimeType,
        name: `file.${payloadMimeTypeToExt(state.payload.mimeType)}`,
        data,
      })
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false })
    }
  }
  return (
    <div className={styles.container}>
      {/* Source section */}
      <section className={styles.source}>
        <div className={styles.title}>
          <span>Source </span>
          {state.source.data && (
            <button
              className={styles.clearBtn}
              onClick={() => dispatch({ type: 'CLEAR' })}
            >
              Clear
            </button>
          )}
          {state.source.data && (
            <button
              className={styles.decodebtn}
              onClick={onDecode}
              disabled={state.loading}
            >
              {state.loading ? 'Decoding...' : 'Decode'}
            </button>
          )}
        </div>
        <BitsSelect value={state.payload.bits} onChange={onBitsChange} />
        {!state.source.data && (
          <Dropzone
            accept={acceptSource}
            onDrop={(acceptedFiles) => {
              acceptedFiles.map((file) => {
                const reader = new FileReader()
                reader.onload = function (e) {
                  if (e.target == null) return
                  if (typeof e.target.result !== 'string') return
                  dispatch({
                    type: 'SET_SOURCE_DATA',
                    mimeType: file.type as SourceMimeTypes,
                    name: file.name,
                    data: e.target.result,
                  })
                }
                reader.readAsDataURL(file)
                return file
              })
            }}
          />
        )}
        {state.source.data && (
          <div className={styles.images}>
            <div>
              <SourceViewer
                data={state.source.data}
                mime={state.source.mimeType}
              />
            </div>
          </div>
        )}
      </section>

      {/* Payload section */}
      <section className={styles.payload}>
        <div className={styles.title}>
          <span>Payload </span>
          {state.payload.type === 'file' && state.payload.data && (
            <a
              className={styles.download}
              download={`file.${payloadMimeTypeToExt(state.payload.mimeType)}`}
              href={state.payload.data}
            >
              Download
            </a>
          )}
        </div>

        {/* Payload type selection */}
        <div className={styles.form}>
          <span>Type: </span>
          <button
            className={state.payload.type === 'message' ? styles.selected : ''}
            onClick={(): void =>
              dispatch({ type: 'SET_PAYLOAD_TYPE', payloadType: 'message' })
            }
          >
            Message
          </button>
          <button
            className={state.payload.type === 'file' ? styles.selected : ''}
            onClick={(): void =>
              dispatch({ type: 'SET_PAYLOAD_TYPE', payloadType: 'file' })
            }
          >
            File
          </button>
        </div>

        <div>
          <span>Size: </span>
          <input
            type="text"
            onChange={onPayloadSizeChange}
            value={state.payload.size || ''}
          />
        </div>
        {/* Mime type selection  */}
        {state.payload.type === 'file' && !state.payload.data && (
          <div className={styles.form}>
            <span>Extension: </span>
            <select
              name="mimetype"
              id="mimetype"
              onChange={onMimeTypeChange}
              value={state.payload.mimeType || 'image/png'}
            >
              <option value={'image/png'}>png</option>
              <option value={'image/jpg'}>jpg</option>
              <option value={'image/jpeg'}>jpeg</option>
              <option value={'image/bmp'}>bmp</option>
              <option value={'audio/wav'}>wav</option>
              <option value={'audio/mpeg'}>mp3</option>
              <option value={'text/plain'}>txt</option>
              <option value={'application/pdf'}>pdf</option>
              <option
                value={
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                }
              >
                docx
              </option>
              <option
                value={
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                }
              >
                pptx
              </option>
              <option
                value={
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
              >
                xlsx
              </option>
            </select>
          </div>
        )}
        {/* Text payload */}
        {state.payload.type === 'message' && (
          <textarea
            disabled={true}
            value={state.payload.data || ''}
            name="message"
            id="message"
            cols={30}
            rows={14}
          ></textarea>
        )}

        {/* File payload viewer */}
        <PayloadViewer
          data={state.payload.data}
          mime={state.payload.mimeType}
          name={state.payload.name}
          type={state.payload.type}
        />
      </section>
    </div>
  )
}

export default Decode
