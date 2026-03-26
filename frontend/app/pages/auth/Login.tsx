import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@/shared/api/user";
import toast from "react-hot-toast";

export function Login() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!login || !password) {
      setError("Введите логин и пароль");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await loginUser({ login, password });
      toast.success("Вы успешно вошли в аккаунт");
      navigate("/");
    } catch (err: unknown) {
      toast.error("Ошибка входа" + err);

      let errorMessage = "Ошибка входа. Попробуйте позже.";

      if (err && typeof err === "object" && err !== null) {
        const data =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (err as any).detail !== undefined ? err : (err as any).response?.data;

        if (data && typeof data.detail === "string") {
          const detail = data.detail.toLowerCase();

          if (detail.includes("invalid credentials")) {
            errorMessage = "Неверный логин или пароль";
          } else {
            errorMessage = data.detail;
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
      <div className="bg-gray-200 p-8 rounded-xl shadow-2xl w-full max-w-xs md:max-w-sm border border-gray-700">
        <h1 className="text-3xl font-bold text-center mb-8">Вход</h1>

        <input
          type="email"
          placeholder="Email"
          value={login}
          onChange={(e) => setLogin(e.target.value.trim())}
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
            w-full px-4 py-3 rounded-lg mt-4
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
          onClick={handleLogin}
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
          {isLoading ? "Вход..." : "Войти"}
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Нет аккаунта?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-blue-600 hover:underline font-medium"
          >
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  );
}
