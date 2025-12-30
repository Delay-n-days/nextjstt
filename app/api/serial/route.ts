import { NextRequest, NextResponse } from 'next/server'
import { SerialPort } from 'serialport'

let currentPort: SerialPort | null = null
let dataBuffer: string[] = []

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    if (action === 'list') {
      const ports = await SerialPort.list()
      return NextResponse.json({ success: true, ports: ports.map(p => p.path) })
    }

    if (action === 'read') {
      const data = [...dataBuffer]
      dataBuffer = []
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ success: false, error: '未知操作' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json()
    const { action, port, baudRate, data, mode } = body

    if (action === 'open') {
      if (currentPort?.isOpen) currentPort.close()

      currentPort = new SerialPort({ path: port, baudRate: baudRate || 9600, autoOpen: false })

      return new Promise<Response>(resolve => {
        currentPort!.open(err => {
          if (err) {
            resolve(NextResponse.json({ success: false, error: err.message }))
            return
          }

          currentPort!.on('data', (chunk: Buffer) => {
            dataBuffer.push(chunk.toString('utf-8'))
            if (dataBuffer.length > 1000) dataBuffer = dataBuffer.slice(-500)
          })

          currentPort!.on('error', err => console.error('串口错误:', err))

          resolve(NextResponse.json({ success: true, message: `串口 ${port} 已打开` }))
        })
      })
    }

    if (action === 'close') {
      if (currentPort?.isOpen) {
        return new Promise<Response>(resolve => {
          currentPort!.close(err => {
            if (err) {
              resolve(NextResponse.json({ success: false, error: err.message }))
              return
            }
            currentPort = null
            dataBuffer = []
            resolve(NextResponse.json({ success: true, message: '串口已关闭' }))
          })
        })
      }
      return NextResponse.json({ success: true, message: '串口未打开' })
    }

    if (action === 'send') {
      if (!currentPort?.isOpen) {
        return NextResponse.json({ success: false, error: '串口未打开' })
      }

      return new Promise<Response>(resolve => {
        let buffer: Buffer

        if (mode === 'hex') {
          const hexStr = data.replace(/\s+/g, '')
          if (!/^[0-9A-Fa-f]*$/.test(hexStr)) {
            resolve(NextResponse.json({ success: false, error: 'HEX 格式错误' }))
            return
          }
          const bytes: number[] = []
          for (let i = 0; i < hexStr.length; i += 2) {
            bytes.push(parseInt(hexStr.substr(i, 2), 16))
          }
          buffer = Buffer.from(bytes)
        } else {
          buffer = Buffer.from(data + '\r\n', 'utf-8')
        }

        currentPort!.write(buffer, err => {
          if (err) {
            resolve(NextResponse.json({ success: false, error: err.message }))
            return
          }
          resolve(NextResponse.json({ success: true, message: '发送成功' }))
        })
      })
    }

    return NextResponse.json({ success: false, error: '未知操作' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
