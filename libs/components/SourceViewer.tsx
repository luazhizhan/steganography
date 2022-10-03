import { lazy } from 'react'
import { Data, SourceMimeTypes } from '../helper'
const DocViewer = lazy(() => import('./Viewer'))

type Props = {
  mime: SourceMimeTypes
  data: Data
  name: Data
  style?: React.CSSProperties
}

function SourceViewer(props: Props): JSX.Element {
  const { data, mime, name, style } = props

  if (!data) return <></>

  // Audio payload
  if (mime.includes('audio')) {
    return (
      <audio controls>
        <source src={data} type={mime} />
      </audio>
    )
  }

  // Video payload
  if (mime.includes('video')) {
    return (
      <video controls>
        <source src={data} type={mime} />
      </video>
    )
  }

  if (mime === 'image/tiff') {
    return <b>{name}</b>
  }

  // Other file viewer (images,pdf,html,etc)
  return <DocViewer data={data} style={style} />
}

export default SourceViewer
