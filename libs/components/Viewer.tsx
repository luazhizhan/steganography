import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer'

type Props = {
  data: string
}
function Viewer(props: Props): JSX.Element {
  const { data } = props
  return (
    <DocViewer
      config={{ header: { disableHeader: true } }}
      pluginRenderers={DocViewerRenderers}
      documents={[{ uri: data, fileName: 'file' }]}
    />
  )
}

export default Viewer
