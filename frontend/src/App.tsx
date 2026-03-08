import { useEffect, useState } from 'react'
import logo from '/src/assets/logo/favicon.svg'

function App() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState("NOT RESPONDING");
  const [messageBackendToML, setMessageBackendToML] = useState("NOT RESPONDING");

  useEffect(() => {
    fetch("http://localhost:8000")
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch((error) => console.error(error));

    fetch("http://localhost:8000/ml")
      .then((response) => response.json())
      .then((data) => {
        setMessageBackendToML(data.tokens);
      })
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className="h-dvh w-dvw bg-gray-300 flex flex-col justify-center items-center p-8 overflow-auto">
      <div className="mb-8 bg-gray-400">
        <img src={logo} className="h-40" alt="React logo" />
      </div>
      <h1 className="text-4xl font-bold mb-8 bg-gray-400 p-16">Vite + React</h1>
      <div className="absolute right-0 top-0 bg-white m-5 p-6 rounded-lg cursor-grab active:cursor-grabbing shadow-md text-center opacity-80">
        <button 
          onClick={() => setCount((count) => count + 1)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          count is {count}
        </button>
        <p className="text-gray-700 text-xs mb-2 line-clamp-1">
          Сообщение от бека: {message}
        </p>
        <p className="text-gray-700 text-xs line-clamp-1">
          Сообщение от МЛ (через бек): {messageBackendToML}
        </p>
      </div>
    </div>
  )
}

export default App
