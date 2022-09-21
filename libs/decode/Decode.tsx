import { ChangeEvent, lazy, useReducer } from 'react'
import BitsSelect from '../components/BitsSelect'
import Dropzone from '../components/Dropzone'
import {
  acceptSource,
  Bits,
  blobToBase64,
  Data,
  mineTypeToExt,
  PayloadMineTypes,
  Payloads,
} from '../helper'
import styles from './Decode.module.css'

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
    data: Data
  }
  loading: boolean
}

type Action =
  | { type: 'SET_BITS'; bits: Bits }
  | { type: 'SET_PAYLOAD_TYPE'; payloadType: Payloads }
  | { type: 'SET_PAYLOAD_MINE_TYPE'; mineType: PayloadMineTypes }
  | {
      type: 'SET_PAYLOAD_DATA'
      name: Data
      data: Data
      mineType: PayloadMineTypes
    }
  | { type: 'SET_SOURCE_DATA'; data: Data; name: string }
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
          mineType: action.payloadType === 'file' ? 'image/png' : null,
        },
      }
    }
    case 'SET_PAYLOAD_MINE_TYPE': {
      return {
        ...state,
        payload: {
          ...state.payload,
          mineType: action.mineType,
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
    case 'SET_SOURCE_DATA': {
      return {
        ...state,
        source: {
          ...state.source,
          name: action.name,
          data: action.data,
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
      data: null,
      mineType: null,
      name: null,
    },
    source: { type: 'image/*', name: null, data: null },
    loading: false,
  })

  const onBitsChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    dispatch({ type: 'SET_BITS', bits: parseInt(e.target.value) as Bits })
  }

  const onMineTypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    dispatch({
      type: 'SET_PAYLOAD_MINE_TYPE',
      mineType: e.target.value as PayloadMineTypes,
    })
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
      bodyData.append('mineType', state.payload.mineType || '')
      const decodeRes = await fetch('/api/decode/from-image', {
        method: 'POST',
        body: bodyData,
      })

      // Error in decoding
      if (!decodeRes.ok) {
        const error = await decodeRes.json()
        return alert(error.message)
      }

      // Get data according to payload mine type
      const data = await (async () => {
        if (!state.payload.mineType) {
          const json = await decodeRes.json()
          return json.message as string
        }
        const receiveFile = await decodeRes.blob()
        return blobToBase64(receiveFile)
      })()
      if (data instanceof Error) return

      dispatch({
        type: 'SET_PAYLOAD_DATA',
        mineType: state.payload.mineType,
        name: `file.${mineTypeToExt(state.payload.mineType)}`,
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
              <span>Original</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.source.data} alt="Uploaded image" />
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
              download={`file.${mineTypeToExt(state.payload.mineType)}`}
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

        {/* Mine type selection  */}
        {state.payload.type === 'file' && !state.payload.data && (
          <div className={styles.form}>
            <span>Extension: </span>
            <select
              name="minetype"
              id="minetype"
              onChange={onMineTypeChange}
              value={state.payload.mineType || 'image/png'}
            >
              <option value={'image/png'}>png</option>
              <option value={'image/jpg'}>jpg</option>
              <option value={'image/jpeg'}>jpeg</option>
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

        {/* File payload */}
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
    </div>
  )
}

export default Decode
