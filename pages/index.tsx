import type { NextPage } from 'next'
import { useState } from 'react'
import Decode from '../libs/decode/Decode'
import Encode from '../libs/encode/Encode'
import styles from '../styles/index.module.css'

const Home: NextPage = () => {
  const [tab, setTab] = useState<'encode' | 'decode'>('encode')
  const encodeStyle =
    tab === 'encode'
      ? `${styles.tab} ${styles.active}`
      : `${styles.tab} ${styles.inactive}`
  const decodeStyle =
    tab === 'decode'
      ? `${styles.tab} ${styles.active}`
      : `${styles.tab} ${styles.inactive}`

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <h1>Steganography</h1>
      </nav>
      <div className={styles.content}>
        <div className={styles.tabs}>
          <button className={encodeStyle} onClick={() => setTab('encode')}>
            Encode
          </button>
          <button className={decodeStyle} onClick={() => setTab('decode')}>
            Decode
          </button>
        </div>
        {tab === 'encode' && <Encode />}
        {tab === 'decode' && <Decode />}
      </div>
    </div>
  )
}

export default Home
