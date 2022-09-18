import { ChangeEvent, useReducer } from 'react'
import BitsSelect from '../../components/BitsSelect'
import Dropzone from '../../components/Dropzone'
import { Bits, BITS_STORED, Data, DELIMITER } from '../helper'
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
  }
}

function Encode(): JSX.Element {
  const [state, dispatch] = useReducer(reducer, {
    payload: { type: 'message', bits: 0, data: null },
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

  const onEncode = (): void => {
    if (!state.payload.data || !state.source.original) return

    // Create image element
    const image = new Image()
    image.src = state.source.original
    const shadowCanvas = document.createElement('canvas')
    const shadowCtx = shadowCanvas.getContext('2d')

    if (!shadowCtx) return

    // Get image data using shadow canvas
    shadowCanvas.style.display = 'none'
    shadowCanvas.width = image.width
    shadowCanvas.height = image.height
    shadowCtx.globalAlpha = 1
    shadowCtx.drawImage(image, 0, 0, image.width, image.height)
    const imageData = shadowCtx.getImageData(0, 0, image.width, image.height)

    // Get payload data with delimiter in binary
    const payloadBinary = `${DELIMITER}${state.payload.data}${DELIMITER}`
      .split('')
      .map((c) => c.charCodeAt(0).toString(2).padStart(BITS_STORED, '0'))

    // Get size of payload and image data
    const payloadLength = payloadBinary.join('').length
    const limit = (imageData.data.length * (state.payload.bits + 1)) / 4

    // Error if payload is too big
    if (limit < payloadLength) {
      const diff = Math.ceil((payloadLength - limit) / 8)
      alert(
        `Payload too big (by ${diff}bytes). Increase bits or change your payload.`
      )
      return
    }

    let payloadIndex = 0
    let sourceIndex = 0
    while (payloadIndex < payloadBinary.length) {
      // Get payload bits data
      const payloadBits = payloadBinary[payloadIndex++].split('')
      let payloadBitsIndex = 0

      // Store bits according to bits option in image data
      while (payloadBitsIndex < payloadBits.length) {
        // User specified bits size to store for current image pixel
        let bitsLeft = state.payload.bits

        // Convert image pixel to bits
        const sourceBitsBinary = imageData.data[sourceIndex]
          .toString(2)
          .split('')
        // Store bits in image pixel
        let sourceBitsIndex = sourceBitsBinary.length - 1
        while (
          bitsLeft >= 0 &&
          sourceBitsIndex >= 0 &&
          payloadBitsIndex < payloadBits.length
        ) {
          sourceBitsBinary[sourceBitsIndex--] = payloadBits[payloadBitsIndex++]
          bitsLeft--
        }

        // Convert image pixel back to decimal and replace existing pixel in image data
        imageData.data[sourceIndex] = parseInt(sourceBitsBinary.join(''), 2)
        sourceIndex += 4
      }
    }

    // Update canvas shadow with new image data
    shadowCtx.putImageData(imageData, 0, 0)

    dispatch({
      type: 'SET_SOURCE_ENCODED_DATA',
      data: shadowCanvas.toDataURL(),
    })
    image.remove()
    shadowCanvas.remove()
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
              <button onClick={onEncode}>Encode</button>
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
