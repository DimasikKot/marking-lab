import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Register() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {

    const response = await fetch(
      import.meta.env.VITE_BACKEND_URL + "/users/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      }
    );

    if (response.ok) {
      alert("Пользователь создан");
      navigate("/login");
    } else {
      alert("Ошибка регистрации");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-200 p-8 rounded-xl shadow-2xl w-full max-w-xs md:max-w-sm border border-gray-700">
        <h1 className="text-3xl font-bold text-center mb-8">
          Регистрация
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="
            w-full px-4 py-3 rounded-lg 
            bg-gray-100
            border border-gray-600 
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30
            transition-all duration-200
          "
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="
            w-full px-4 py-3 rounded-lg mt-4
            bg-gray-100
            border border-gray-600 
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30
            transition-all duration-200
          "
        />

        <button
          onClick={handleRegister}
          className="
            w-full mt-6 py-3 px-4 font-medium
            bg-blue-600 text-white
            rounded-lg shadow-lg
            transition-all duration-200
            active:scale-[0.98]
          "
        >
          Зарегистрироваться
        </button>
      </div>
    </div>
  );
}