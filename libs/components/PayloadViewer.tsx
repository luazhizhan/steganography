import { lazy } from 'react'
import { Data, PayloadMimeTypes, Payloads } from '../helper'
const DocViewer = lazy(() => import('./Viewer'))

type Props = {
  type: Payloads
  data: Data
  name: Data
  mime: PayloadMimeTypes
}
function PayloadViewer(props: Props): JSX.Element {
  const { type, data, mime, name } = props

  if (type !== 'file' || !data || !mime) return <></>

  // Office documents payload
  if (mime.includes('officedocument')) {
    return (
      <ul
        style={{
          paddingLeft: '17px',
          paddingTop: '10px',
          fontWeight: 500,
        }}
      >
        <li>
          <span>{name}</span>
        </li>
      </ul>
    )
  }

  // Audio payload
  if (mime.includes('audio')) {
    return (
      <audio controls>
        <source src={data} type={mime} />
      </audio>
    )
  }

  // Other file viewer (images,pdf,html,etc)
  return <DocViewer data={data} />
}

export default PayloadViewer
