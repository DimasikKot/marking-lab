import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { registerUser } from "@/shared/api/user";
import { TextField } from "@/shared/components/TextField";
import { Text } from "@/shared/components/Text";
import { PrimaryButton } from "@/shared/components/PrimaryButton";

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
    setIsLoading(true);
    setError(null);
    if (!email || !password) {
      setError("Введите email и пароль");
      return;
    }
    if (!validateEmail(email)) {
      setError("Некорректный формат email (пример: user@example.com)");
      return;
    }
    const response = await registerUser({ username, email, password });
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    if (response === undefined) {
      setError("Ошибка регистрации. Попробуйте позже");
      return;
    }
    toast.success("Вы успешно зарегистрировались");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-200 flex flex-col gap-4 p-8 rounded-xl shadow-2xl w-full max-w-xs md:max-w-sm border border-gray-700">
        <Text size="xl" className="text-center">
          Регистрация
        </Text>

        <TextField
          value={username}
          setValue={setUsername}
          placeholder="Имя пользователя"
          disabled={isLoading}
          className="mt-4"
        />

        <TextField
          value={email}
          setValue={setEmail}
          placeholder="Email"
          disabled={isLoading}
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
          onClick={handleRegister}
          disabled={isLoading}
          className="mt-4"
        >
          {isLoading ? "Регистрация..." : "Зарегистрироваться"}
        </PrimaryButton>
      </div>
    </div>
  );
}
