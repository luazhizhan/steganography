import { ChangeEvent, useReducer } from 'react'
import BitsSelect from '../../components/BitsSelect'
import Dropzone from '../../components/Dropzone'
import { Bits, BITS_STORED, Data, DELIMITER } from '../helper'
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
  }
}

function Decode(): JSX.Element {
  const [state, dispatch] = useReducer(reducer, {
    payload: { type: 'message', bits: 0, data: null },
    source: { type: 'image/*', name: null, data: null },
    loading: false,
  })

  const onBitsChange = (e: ChangeEvent<HTMLSelectElement>): void =>
    dispatch({ type: 'SET_BITS', bits: parseInt(e.target.value) as Bits })

  const onDecode = (): void => {
    if (!state.source.data) return

    // Create image element
    const image = new Image()
    image.src = state.source.data
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

    let sourceIndex = 0
    let payload = ''
    let invalid = false
    let found = false
    while (sourceIndex < imageData.data.length) {
      let binaryChar = ''
      while (binaryChar.length < BITS_STORED) {
        // User specified bits size to store for current image pixel
        let bitsLeft = state.payload.bits

        // Convert image pixel to binary
        const sourceBitsBinary = imageData.data[sourceIndex]
          .toString(2)
          .split('')
        sourceIndex += 4

        // Get bit from from the back of the image pixel binary
        let sourceBitsIndex = sourceBitsBinary.length - 1
        while (
          bitsLeft >= 0 &&
          sourceBitsIndex >= 0 &&
          binaryChar.length < BITS_STORED
        ) {
          binaryChar += sourceBitsBinary[sourceBitsIndex--]
          bitsLeft--
        }
      }
      payload += String.fromCharCode(parseInt(binaryChar, 2))

      if (payload.length === 3 && payload !== DELIMITER) {
        invalid = true
        break
      }
      if (
        payload.length > 3 &&
        payload.substring(payload.length - 3) === DELIMITER
      ) {
        found = true
        break
      }
    }

    if (invalid) return alert('Invalid image or bit size given.')
    if (!found) {
      return alert(
        'No payload found. Ensure that bit size specified is correct'
      )
    }

    dispatch({
      type: 'SET_PAYLOAD_DATA',
      data: payload.substring(3, payload.length - 3),
    })
    image.remove()
    shadowCanvas.remove()
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
            <button className={styles.decodebtn} onClick={onDecode}>
              Decode
            </button>
          )}
        </div>
        <BitsSelect value={state.payload.bits} onChange={onBitsChange} />
        {!state.source.data && (
          <Dropzone
            accept={{
              'image/png': [],
              'image/jpg': [],
              'image/jpeg': [],
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
