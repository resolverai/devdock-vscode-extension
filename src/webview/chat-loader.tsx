import { useEffect, useState } from 'react'
import { ASSISTANT } from '../common/constants'
import { useLoading, useTheme } from './hooks'
import { Message } from './message'

export const ChatLoader = () => {
  const theme = useTheme()
  const loader = useLoading()
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => {
        switch (prevDots) {
          case '':
            return '.'
          case '.':
            return '..'
          case '..':
            return '...'
          default:
            return ''
        }
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (

    <div style={{

      maxHeight: '68vh', // Maximum height for the scroll area
      overflowY: 'auto', // Enable vertical scrolling when content exceeds maxHeight
      padding: '10px',
      // border: '1px solid #ccc',
      borderRadius: '5px',
      backgroundColor: 'black'

    }}>
      <Message
        isLoading
        isAssistant
        theme={theme}
        message={{
          content: `${loader || 'Thinking'}${dots}`,
          role: ASSISTANT
        }}
      ></Message>
    </div>
  )
}

export default ChatLoader
