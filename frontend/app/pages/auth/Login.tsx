import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@/shared/api/user";
import toast from "react-hot-toast";
import { TextField } from "@/shared/components/TextField";
import { Text } from "@/shared/components/Text";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";

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
    }, 1000);
    if (response === undefined) {
      setError("Ошибка входа. Попробуйте позже");
      return;
    }
    toast.success("Вы успешно вошли в аккаунт");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-200 flex flex-col gap-4 p-8 rounded-xl shadow-2xl w-full max-w-xs md:max-w-sm border border-gray-700">
        <Text size="xl" className="text-center">
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
          <Text size="small" className="text-red-600">
            {error}
          </Text>
        )}

        <PrimaryButton
          onClick={handleLogin}
          disabled={isLoading}
          className="mt-4"
        >
          {isLoading ? "Вход..." : "Войти"}
        </PrimaryButton>

        <Text size="small" className="text-center text-gray-100">
          Нет аккаунта?{" "}
          <SecondaryButton
            size="small"
            onClick={() => navigate("/register")}
            className="hover:underline"
          >
            Зарегистрироваться
          </SecondaryButton>
        </Text>
      </div>
    </div>
  );
}
