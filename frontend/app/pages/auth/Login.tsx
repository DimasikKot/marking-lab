import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@/shared/api/user";
import toast from "react-hot-toast";
import { TextField } from "@/shared/components/TextField";
import { Text } from "@/shared/components/Text";
import { Button } from "@/shared/components/Button";

export function Login() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    if (!login || !password) {
      setError("Введите логин и пароль");
      return;
    }
    const response = await loginUser({ login, password });
    setTimeout(() => {
      setIsLoading(false);
      if (response === undefined) {
        setError("Ошибка входа. Попробуйте позже");
        return;
      }
      toast.success("Вы успешно вошли в аккаунт");
      navigate("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-200 flex flex-col gap-4 p-8 rounded-xl shadow-2xl w-full max-w-xs md:max-w-sm border border-gray-700">
        <Text variant="header" className="text-center">
          Вход
        </Text>

        <TextField
          value={login}
          setValue={setLogin}
          placeholder="Имя пользователя или Email"
          disabled={isLoading}
          className="mt-4"
          type="email"
        />

        <TextField
          value={password}
          setValue={setPassword}
          placeholder="Пароль"
          disabled={isLoading}
          type="password"
        />

        {error && (
          <Text variant="description" className="text-red-600">
            {error}
          </Text>
        )}

        <Button onClick={handleLogin} disabled={isLoading} className="mt-4">
          {isLoading ? "Вход..." : "Войти"}
        </Button>

        <Text variant="description" className="text-center">
          Нет аккаунта?{" "}
          <Button
            variant="link"
            onClick={() => navigate("/register")}
          >
            Зарегистрироваться
          </Button>
        </Text>
      </div>
    </div>
  );
}
