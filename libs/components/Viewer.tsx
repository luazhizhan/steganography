import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer'

type Props = {
  data: string
  style?: React.CSSProperties
}
function Viewer(props: Props): JSX.Element {
  const { data, style } = props
  return (
    <DocViewer
      config={{ header: { disableHeader: true } }}
      style={{
        fontSize: '1.5rem',
        maxWidth: '50vw',
        maxHeight: '50vh',
        ...style,
      }}
      pluginRenderers={DocViewerRenderers}
      documents={[{ uri: data, fileName: 'file' }]}
    />
  )
}

export default Viewer
