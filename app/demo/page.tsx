// 默认就是 Server Component，无需 'use client'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { SerialPort } from 'serialport'
// 这个函数在服务端执行
async function getProjectFiles() {
  const projectRoot = process.cwd()
  const files = await readdir(projectRoot)
  return files
}


export default async function DemoPage() {
  // ✅ 直接调用服务端函数，无需 fetch
  const files = await getProjectFiles()
  
  // ✅ 可以直接访问 Node.js API
  const serverTime = new Date().toLocaleString('zh-CN')
  const nodeVersion = process.version
  const platform = process.platform

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🖥️ 服务端组件演示</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">服务器信息</h2>
          <p>服务器时间: {serverTime}</p>
          <p>Node.js 版本: {nodeVersion}</p>
          <p>操作系统: {platform}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">项目根目录文件</h2>
          <ul className="list-disc list-inside">
            {files.map(file => (
              <li key={file} className="text-sm">{file}</li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm">
            💡 <strong>提示：</strong>这个页面在服务端渲染，直接访问了文件系统和 Node.js API。
            刷新页面会重新执行服务端代码，时间会更新。
          </p>
        </div>
      </div>
    </div>
  )
}
