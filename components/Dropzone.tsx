import { DropEvent, FileRejection, useDropzone } from 'react-dropzone'
import styles from './Dropzone.module.css'

type Props = {
  onDrop?: <T extends File>(
    acceptedFiles: T[],
    fileRejections: FileRejection[],
    event: DropEvent
  ) => void
  accept: {
    [key: string]: string[]
  }
}

function Dropzone(props: Props): JSX.Element {
  const { onDrop, accept } = props
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  })

  return (
    <div {...getRootProps({ className: 'dropzone' })}>
      <input {...getInputProps()} />
      <p className={styles.dropzone}>
        Drag &apos;n&apos; drop some files here, or click to select files
      </p>
    </div>
  )
}

export default Dropzone
