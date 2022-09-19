import { ChangeEvent, useReducer } from 'react'
import BitsSelect from '../../components/BitsSelect'
import Dropzone from '../../components/Dropzone'
import { Bits, Data } from '../helper'
import styles from './Decode.module.css'

type State = {
  payload: {
    type: 'message'
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
  | { type: 'SET_PAYLOAD_DATA'; data: Data }
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
    case 'SET_PAYLOAD_DATA': {
      return {
        ...state,
        payload: {
          ...state.payload,
          data: action.data,
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
    payload: { type: 'message', bits: 1, data: null },
    source: { type: 'image/*', name: null, data: null },
    loading: false,
  })

  const onBitsChange = (e: ChangeEvent<HTMLSelectElement>): void =>
    dispatch({ type: 'SET_BITS', bits: parseInt(e.target.value) as Bits })

  const onDecode = async (): Promise<void> => {
    if (!state.source.data) return alert('Please select an image')

    // Convert base64 to blob
    const convertRes = await fetch(state.source.data)
    const file = await convertRes.blob()

    // Encode image
    const bodyData = new FormData()
    bodyData.append('lsb', state.payload.bits.toString())
    bodyData.append('file', file)
    const decodeRes = await fetch('/api/decode/text-from-image', {
      method: 'POST',
      body: bodyData,
    })
    if (!decodeRes.ok) {
      const error = await decodeRes.json()
      return alert(error.message)
    }

    const data = await decodeRes.json()
    dispatch({
      type: 'SET_PAYLOAD_DATA',
      data: data.text,
    })
  }
  return (
    <div className={styles.container}>
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
            accept={{
              'image/png': [],
              'image/bmp': [],
            }}
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
        <div className={styles.images}>
          {state.source.data && (
            <div>
              <span>Original</span>
              {/* eslint-disable @next/next/no-img-element */}
              <img src={state.source.data} alt="Uploaded image" />
            </div>
          )}
        </div>
      </section>
      <section className={styles.payload}>
        <div className={styles.title}>
          <span>Payload </span>
        </div>
        <div className={styles.form}>
          <span>Type: </span>
          <button>Message</button>
        </div>
        <textarea
          disabled={true}
          value={state.payload.data == null ? '' : state.payload.data}
          name="message"
          id="message"
          cols={30}
          rows={14}
        ></textarea>
      </section>
    </div>
  )
}

export default Decode
