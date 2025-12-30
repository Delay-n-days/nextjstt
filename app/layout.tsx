import './globals.css'

export const metadata = {
  title: '串口助手',
  description: '基于 Next.js 的串口调试工具',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
