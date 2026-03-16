import { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom";
import { fetchBackendEcho, fetchMLEcho } from '@/shared/api/echo';
import logo from '@/assets/logo/favicon.svg'

export function General() {
  const navigate = useNavigate();
  const [messageBackend, setMessageBackend] = useState("Backend контейнер не работает");
  const [messageML, setMessageML] = useState("ML контейнер не работает");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBackendEcho();
        if (data?.detail === undefined) return;
        setMessageBackend(data.detail);
      } catch (error: unknown) {
        console.error(error);
      }
      
      try {
        const data = await fetchMLEcho();
        if (data?.detail === undefined) return;
        setMessageML(data.detail);
      } catch (error: unknown) {
        console.error(error);
      }
    };

    load();
  });

  return (
    <div className="h-full w-full flex flex-col justify-center items-center p-8 overflow-auto">
      <div className="mb-8 flex flex-row">
        <img src={logo} className="h-40 rounded-3xl bg-green-300" alt="React logo" />

        <h1 className="text-4xl font-bold rounded-3xl ml-8 p-8 bg-red-200 self-center">Vite + React</h1>
      </div>

      <div className='flex-row justify-center items-center m-8 rounded-4xl bg-amber-200'>
        <button className='m-4 p-2 rounded-2xl bg-blue-200' onClick={() => {navigate("/first")}}>
          <p>Перейти на главную страницу</p>
        </button>

        <button className='m-4 p-2 rounded-2xl bg-blue-300' onClick={() => {navigate("/second")}}>
          <p>Перейти на вторую страницу</p>
        </button>
        
        <button className='m-4 p-2 rounded-2xl bg-blue-400' onClick={() => {navigate("/third")}}>
          <p>Перейти на третью страницу</p>
        </button>

        <button className='m-4 p-2 rounded-2xl bg-blue-500' onClick={() => {navigate("/login")}}>
          <p>Вход</p>
        </button>

        <button className='m-4 p-2 rounded-2xl bg-blue-500' onClick={() => {navigate("/register")}}>
          <p>Авторизация</p>
        </button>
      </div>
    
      <div className="absolute right-0 top-0 bg-white m-5 p-6 rounded-lg cursor-grab active:cursor-grabbing shadow-md text-center opacity-80">
        <p className={`${messageBackend === "Backend контейнер не работает" ? "text-red-700" : "text-green-700"} text-md mb-2 line-clamp-1`}>
          {messageBackend}
        </p>

        <p className={`${messageML === "ML контейнер не работает" ? "text-red-700" : "text-green-700"} text-md line-clamp-1`}>
          {messageML}
        </p>
      </div>
    </div>
  )
}
