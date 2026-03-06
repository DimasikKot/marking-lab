import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

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
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Message from backend: {message}
        </p>
        <p>
          Message from backend to ML: {messageBackendToML}
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
