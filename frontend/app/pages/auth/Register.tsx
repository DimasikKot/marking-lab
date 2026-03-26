import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "@/shared/api/user";
import toast from "react-hot-toast";

export function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailVal = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailVal.test(email);
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setError("Введите email и пароль");
      return;
    }

    setError(null);

    if (!validateEmail(email)) {
      setError("Некорректный формат email (пример: user@example.com)");
      return;
    }

    setIsLoading(true);

    try {
      await registerUser({ username, email, password });
      toast.success("Вы успешно зарегистрировались");
      navigate("/");
    } catch (err: unknown) {
      toast.error("Ошибка регистрации");

      let errorMessage = "Ошибка регистрации. Попробуйте позже.";

      if (err && typeof err === "object" && err !== null) {
        const data =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (err as any).detail !== undefined ? err : (err as any).response?.data;

        if (data && typeof data.detail === "string") {
          const detail = data.detail;

          if (detail.toLowerCase().includes("already registered")) {
            errorMessage = "Пользователь с таким email уже зарегистрирован";
          } else {
            errorMessage = detail;
          }
        }
      }

      setError(errorMessage);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-200 flex flex-col gap-4 p-8 rounded-xl shadow-2xl w-full max-w-xs md:max-w-sm border border-gray-700">
        <h1 className="text-3xl font-bold text-center mb-8">Регистрация</h1>

        <input
          type="text"
          placeholder="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
          className="
            w-full px-4 py-3 rounded-lg 
            bg-gray-100
            border border-gray-600 
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30
            transition-all duration-200
          "
          disabled={isLoading}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          className="
            w-full px-4 py-3 rounded-lg 
            bg-gray-100
            border border-gray-600 
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30
            transition-all duration-200
          "
          disabled={isLoading}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="
            w-full px-4 py-3 rounded-lg
            bg-gray-100
            border border-gray-600 
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30
            transition-all duration-200
          "
          disabled={isLoading}
        />

        {error && (
          <p className="mt-3 text-red-600 text-center text-sm">{error}</p>
        )}

        <button
          onClick={handleRegister}
          disabled={isLoading}
          className="
            w-full mt-6 py-3 px-4 font-medium
            bg-blue-600 text-white
            rounded-lg shadow-lg
            transition-all duration-200
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isLoading ? "Регистрация..." : "Зарегистрироваться"}
        </button>
      </div>
    </div>
  );
}
