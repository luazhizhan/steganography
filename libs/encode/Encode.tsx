import { ChangeEvent, lazy, useReducer } from 'react'
import BitsSelect from '../components/BitsSelect'
import Dropzone from '../components/Dropzone'
import {
  acceptSource,
  Bits,
  blobToBase64,
  Data,
  PayloadMineTypes,
  Payloads,
} from '../helper'
import styles from './Encode.module.css'

// Must be lazily imported as this requires window object
const DocViewer = lazy(() => import('../components/Viewer'))

type State = {
  payload: {
    type: Payloads
    mineType: PayloadMineTypes
    name: Data
    bits: Bits
    data: Data
  }
  source: {
    type: 'image/*'
    name: Data
    original: Data
    encoded: Data
  }
  loading: boolean
}

type Action =
  | { type: 'SET_BITS'; bits: Bits }
  | { type: 'SET_PAYLOAD_TYPE'; payloadType: Payloads }
  | {
      type: 'SET_PAYLOAD_DATA'
      name: Data
      data: Data
      mineType: PayloadMineTypes
    }
  | {
      type: 'SET_SOURCE_ORIGINAL_DATA'
      data: string
      name: string
    }
  | { type: 'SET_SOURCE_ENCODED_DATA'; data: Data }
  | { type: 'CLEAR_SOURCE' }
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
          mineType: null,
          data: null,
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
          mineType: action.mineType,
        },
      }
    }
    case 'SET_SOURCE_ORIGINAL_DATA': {
      return {
        ...state,
        source: {
          ...state.source,
          name: action.name,
          original: action.data,
          encoded: null,
        },
      }
    }
    case 'SET_SOURCE_ENCODED_DATA': {
      return {
        ...state,
        source: {
          ...state.source,
          encoded: action.data,
        },
      }
    }
    case 'CLEAR_SOURCE': {
      return {
        ...state,
        source: {
          ...state.source,
          name: null,
          original: null,
          encoded: null,
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

function Encode(): JSX.Element {
  const [state, dispatch] = useReducer(reducer, {
    payload: {
      type: 'message',
      name: null,
      mineType: null,
      bits: 1,
      data: null,
    },
    source: {
      type: 'image/*',
      name: null,
      original: null,
      encoded: null,
    },
    loading: false,
  })

  const onBitsChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    dispatch({ type: 'SET_BITS', bits: parseInt(e.target.value) as Bits })
  }

  const onMsgPayloadChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    const data = ((): string | null => {
      if (!e.target.value.trim()) return null
      return e.target.value
    })()
    dispatch({ type: 'SET_PAYLOAD_DATA', data, mineType: null, name: null })
  }

  const onEncode = async (): Promise<void> => {
    if (!state.payload.data || !state.source.original) {
      return alert('Please select a file and enter a message')
    }

    try {
      dispatch({ type: 'SET_LOADING', loading: true })

      // Convert base64 to blob
      const convertRes = await fetch(state.source.original)
      const file = await convertRes.blob()

      // Get correct payload data format
      const payloadData = state.payload.data
      const payload = await (async () => {
        if (state.payload.type === 'message') {
          return payloadData
        }
        const payloadConvertRes = await fetch(payloadData)
        return payloadConvertRes.blob()
      })()

      // Encode image
      const bodyData = new FormData()
      bodyData.append('lsb', state.payload.bits.toString())
      bodyData.append('file', file)
      bodyData.append('payload', payload)
      const encodeRes = await fetch('/api/encode/to-image', {
        method: 'POST',
        body: bodyData,
      })

      // Throw error if not 200
      if (!encodeRes.ok) {
        const error = await encodeRes.json()
        return alert(error.message)
      }
      const receiveFile = await encodeRes.blob()

      // To base64 data
      const data = await blobToBase64(receiveFile)
      if (data instanceof Error) return

      dispatch({ type: 'SET_SOURCE_ENCODED_DATA', data })
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false })
    }
  }

  return (
    <div className={styles.container}>
      {/* Payload section */}
      <section className={styles.payload}>
        <span className={styles.title}>Payload </span>

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
        <BitsSelect value={state.payload.bits} onChange={onBitsChange} />

        {/* Text payload message */}
        {state.payload.type === 'message' && (
          <textarea
            onChange={onMsgPayloadChange}
            value={state.payload.data || ''}
            name="message"
            id="message"
            cols={30}
            rows={10}
          ></textarea>
        )}

        {/* Upload file payload */}
        {state.payload.type === 'file' && !state.payload.data && (
          <Dropzone
            accept={{
              any: ['.pdf', '.pptx', '.docx', '.xlsx', '.png'],
            }}
            onDrop={(acceptedFiles) => {
              acceptedFiles.map((file) => {
                const reader = new FileReader()
                reader.onload = function (e) {
                  if (e.target == null) return
                  if (typeof e.target.result !== 'string') return
                  dispatch({
                    type: 'SET_PAYLOAD_DATA',
                    data: e.target.result,
                    name: file.name,
                    mineType: file.type as PayloadMineTypes,
                  })
                }
                reader.readAsDataURL(file)
                return file
              })
            }}
          />
        )}

        {/* File payload viewer */}
        {state.payload.type === 'file' &&
          state.payload.data &&
          !state.payload.mineType?.includes('officedocument') && (
            <DocViewer data={state.payload.data} />
          )}

        {/* Office file payload  */}
        {state.payload.type === 'file' &&
          state.payload.data &&
          state.payload.mineType?.includes('officedocument') && (
            <ul className={styles.officeList}>
              <li>
                <span>{state.payload.name}</span>
              </li>
            </ul>
          )}
      </section>

      {/* Source section */}
      <section className={styles.source}>
        {/* Encode and download file */}
        <div className={styles.title}>
          <span>Source</span>
          <div>
            {state.source.original && (
              <button
                className={styles.clearBtn}
                onClick={() => dispatch({ type: 'CLEAR_SOURCE' })}
              >
                Clear
              </button>
            )}
            {state.source.original && (
              <button
                onClick={onEncode}
                className={styles.encodeBtn}
                disabled={state.loading}
              >
                {state.loading ? 'Encoding...' : 'Encode'}
              </button>
            )}
            {state.source.encoded && (
              <a
                download={`encoded-${state.source.name}`}
                href={state.source.encoded}
              >
                Download
              </a>
            )}
          </div>
        </div>

        {/* Source file upload */}
        {!state.source.original && (
          <Dropzone
            accept={acceptSource}
            onDrop={(acceptedFiles) => {
              acceptedFiles.map((file) => {
                const reader = new FileReader()
                reader.onload = function (e) {
                  if (e.target == null) return
                  if (typeof e.target.result !== 'string') return
                  dispatch({
                    type: 'SET_SOURCE_ORIGINAL_DATA',
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

        {/* Original and encoded file comparison */}
        <div className={styles.sources}>
          {state.source.original && (
            <div>
              <span>Original</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.source.original} alt="Uploaded image" />
            </div>
          )}
          {state.source.encoded && (
            <div>
              <span>Encoded</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.source.encoded} alt="Encoded image" />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Encode
