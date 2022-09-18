import { ChangeEvent } from 'react'

type Props = {
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void
  value: string | ReadonlyArray<string> | number | undefined
}

function BitsSelect(props: Props): JSX.Element {
  const { onChange, value } = props

  return (
    <div>
      <span>Bits: </span>
      <select name="bits" id="bits" onChange={onChange} value={value}>
        <option value={0}>0</option>
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={3}>3</option>
        <option value={4}>4</option>
        <option value={5}>5</option>
        <option value={6}>6</option>
        <option value={7}>7</option>
      </select>
    </div>
  )
}

export default BitsSelect
