import { useState, useEffect } from 'react'
import { api } from './services/api'

function App() {
  const [count, setCount] = useState(0)
  const [backendStatus, setBackendStatus] = useState<string>('Checking...')

  useEffect(() => {
    // Test backend connection using the API service
    api.healthCheck()
      .then(({ data, error }) => {
        if (error) {
          setBackendStatus('Not connected')
        } else if (data) {
          setBackendStatus(`Connected: ${data.message}`)
        }
      })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
        <h1 className="text-4xl font-bold text-white text-center mb-6">
          React + Tailwind
        </h1>
        
        <div className="space-y-4">
          {/* Backend Status */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Backend Status</p>
            <p className={`font-medium ${backendStatus.includes('Connected') ? 'text-green-400' : 'text-yellow-400'}`}>
              {backendStatus}
            </p>
          </div>

          {/* Counter */}
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm mb-2">Counter</p>
            <p className="text-5xl font-bold text-white mb-4">{count}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setCount(c => c - 1)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
              >
                -1
              </button>
              <button
                onClick={() => setCount(0)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                Reset
              </button>
              <button
                onClick={() => setCount(c => c + 1)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
              >
                +1
              </button>
            </div>
          </div>
        </div>

        <p className="text-gray-500 text-center text-sm mt-6">
          TypeScript + Tailwind CSS working!
        </p>
      </div>
    </div>
  )
}

export default App
