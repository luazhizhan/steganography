import { ChangeEvent, useReducer } from 'react'
import BitsSelect from '../../components/BitsSelect'
import Dropzone from '../../components/Dropzone'
import { Bits, blobToBase64, Data } from '../helper'
import styles from './Encode.module.css'

type State = {
  payload: {
    type: 'message'
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
  | { type: 'SET_PAYLOAD_DATA'; data: Data }
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
    case 'SET_PAYLOAD_DATA': {
      return {
        ...state,
        payload: {
          ...state.payload,
          data: action.data,
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
    payload: { type: 'message', bits: 1, data: null },
    source: {
      type: 'image/*',
      name: null,
      original: null,
      encoded: null,
    },
    loading: false,
  })

  const onBitsChange = (e: ChangeEvent<HTMLSelectElement>): void =>
    dispatch({ type: 'SET_BITS', bits: parseInt(e.target.value) as Bits })

  const onPayloadDataChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    const data = ((): string | null => {
      if (!e.target.value.trim()) return null
      return e.target.value
    })()
    dispatch({ type: 'SET_PAYLOAD_DATA', data })
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

      // Encode image
      const bodyData = new FormData()
      bodyData.append('lsb', state.payload.bits.toString())
      bodyData.append('file', file)
      bodyData.append('text', state.payload.data)
      const encodeRes = await fetch('/api/encode/text-to-image', {
        method: 'POST',
        body: bodyData,
      })
      if (!encodeRes.ok) {
        const error = await encodeRes.json()
        return alert(error.message)
      }
      const receiveFile = await encodeRes.blob()

      // To base64
      const data = await blobToBase64(receiveFile)
      if (data instanceof Error) return

      dispatch({ type: 'SET_SOURCE_ENCODED_DATA', data })
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false })
    }
  }

  return (
    <div className={styles.container}>
      <section className={styles.payload}>
        <span className={styles.title}>Payload </span>
        <div className={styles.form}>
          <span>Type: </span>
          <button>Message</button>
        </div>
        <BitsSelect value={state.payload.bits} onChange={onBitsChange} />
        <textarea
          onChange={onPayloadDataChange}
          name="message"
          id="message"
          cols={30}
          rows={10}
        ></textarea>
      </section>
      <section className={styles.source}>
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
        {!state.source.original && (
          <Dropzone
            accept={{
              'image/*': [],
            }}
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
        <div className={styles.sources}>
          {state.source.original && (
            <div>
              <span>Original</span>
              {/* eslint-disable @next/next/no-img-element */}
              <img src={state.source.original} alt="Uploaded image" />
            </div>
          )}
          {state.source.encoded && (
            <div>
              <span>Encoded</span>
              {/* eslint-disable @next/next/no-img-element */}
              <img src={state.source.encoded} alt="Encoded image" />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Encode
