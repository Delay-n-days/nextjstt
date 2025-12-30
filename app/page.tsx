'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Play, Pause, Send, Trash2 } from 'lucide-react'

export default function SerialAssistant() {
  const [ports, setPorts] = useState<string[]>([])
  const [selectedPort, setSelectedPort] = useState('')
  const [baudRate, setBaudRate] = useState(9600)
  const [isConnected, setIsConnected] = useState(false)
  const [receivedData, setReceivedData] = useState<string[]>([])
  const [sendText, setSendText] = useState('')
  const [displayMode, setDisplayMode] = useState<'ascii' | 'hex'>('ascii')
  const [autoScroll, setAutoScroll] = useState(true)
  const dataEndRef = useRef<HTMLDivElement>(null)

  const scanPorts = async () => {
    const res = await fetch('/api/serial?action=list')
    const data = await res.json()
    setPorts(data.ports || [])
  }

  const openPort = async () => {
    if (!selectedPort) return
    const res = await fetch('/api/serial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'open', port: selectedPort, baudRate }),
    })
    const data = await res.json()
    if (data.success) {
      setIsConnected(true)
      startReceiving()
    }
  }

  const closePort = async () => {
    const res = await fetch('/api/serial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close' }),
    })
    const data = await res.json()
    if (data.success) setIsConnected(false)
  }

  const sendData = async () => {
    if (!sendText.trim()) return
    await fetch('/api/serial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', data: sendText, mode: displayMode }),
    })
    setSendText('')
  }

  const startReceiving = () => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/serial?action=read')
      const data = await res.json()
      if (data.data?.length > 0) {
        setReceivedData(prev => [...prev, ...data.data])
      }
    }, 100)
    return () => clearInterval(interval)
  }

  useEffect(() => {
    if (autoScroll) dataEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [receivedData, autoScroll])

  useEffect(() => { scanPorts() }, [])

  const formatData = (data: string) =>
    displayMode === 'hex'
      ? data.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join(' ')
      : data

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">🔌 串口助手</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">串口配置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <select
                value={selectedPort}
                onChange={e => setSelectedPort(e.target.value)}
                disabled={isConnected}
                className="px-3 py-2 border rounded-md bg-white disabled:opacity-50"
              >
                <option value="">选择串口</option>
                {ports.map(port => <option key={port} value={port}>{port}</option>)}
              </select>

              <select
                value={baudRate}
                onChange={e => setBaudRate(Number(e.target.value))}
                disabled={isConnected}
                className="px-3 py-2 border rounded-md bg-white disabled:opacity-50"
              >
                {[9600, 19200, 38400, 57600, 115200].map(rate => (
                  <option key={rate} value={rate}>{rate}</option>
                ))}
              </select>

              <Button onClick={scanPorts} disabled={isConnected} variant="outline" size="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>

              {!isConnected ? (
                <Button onClick={openPort} disabled={!selectedPort}>
                  <Play className="w-4 h-4 mr-2" />
                  连接
                </Button>
              ) : (
                <Button onClick={closePort} variant="destructive">
                  <Pause className="w-4 h-4 mr-2" />
                  断开
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">接收数据</CardTitle>
            <div className="flex gap-3 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} />
                自动滚动
              </label>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" name="mode" checked={displayMode === 'ascii'} onChange={() => setDisplayMode('ascii')} />
                  ASCII
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" name="mode" checked={displayMode === 'hex'} onChange={() => setDisplayMode('hex')} />
                  HEX
                </label>
              </div>
              <Button onClick={() => setReceivedData([])} variant="ghost" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 overflow-y-auto bg-slate-50 rounded-md p-4 font-mono text-sm">
              {receivedData.map((data, idx) => (
                <div key={idx} className="mb-1">{formatData(data)}</div>
              ))}
              <div ref={dataEndRef} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">发送数据</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <input
                type="text"
                value={sendText}
                onChange={e => setSendText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendData()}
                placeholder="输入要发送的数据..."
                disabled={!isConnected}
                className="flex-1 px-3 py-2 border rounded-md disabled:opacity-50"
              />
              <Button onClick={sendData} disabled={!isConnected || !sendText.trim()}>
                <Send className="w-4 h-4 mr-2" />
                发送
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
