import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { loginUser } from "@/shared/api/user";
import { LoginRegisterCard } from "@/shared/components/LoginRegisterCard";
import { TextField } from "@/shared/components/TextField";

export function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!login.trim()) {
        toast.error("Введите имя пользователя или email");
        return;
      }
      setStep(2);
    }
  };

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);

    if (!password) {
      toast.error("Введите пароль");
      setIsLoading(false);
      return;
    }

    const response = await loginUser({ login, password });

    setIsLoading(false);

    if (response === undefined) {
      setError("Неверное имя пользователя или пароль");
      toast.error("Ошибка входа");
      return;
    }

    toast.success("Вы успешно вошли в аккаунт");
    navigate("/");
  };

  const handleBack = () => {
    setError(null);
    if (step === 2) setStep(1);
  };

  const getStepContent = () => {
    if (step === 1) {
      return {
        title: "Вход в аккаунт",
        subtitle: "Введите имя пользователя или email",
        buttonText: "Далее",
        onClick: handleNext,
        children: (
          <TextField
            value={login}
            setValue={setLogin}
            placeholder="Имя пользователя или email"
            disabled={isLoading}
            type="text"
          />
        ),
        backButton: undefined,
      };
    }

    return {
      title: "Введите пароль",
      subtitle: `Для аккаунта: ${login}`,
      buttonText: isLoading ? "Вход..." : "Войти",
      onClick: handleLogin,
      children: (
        <TextField
          value={password}
          setValue={setPassword}
          placeholder="Пароль"
          disabled={isLoading}
          type="password"
        />
      ),
      backButton: {
        text: "Назад",
        onClick: handleBack,
      },
    };
  };

  const { title, subtitle, buttonText, onClick, children, backButton } = getStepContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <LoginRegisterCard
        title={title}
        subtitle={subtitle}
        buttonText={buttonText}
        onButtonClick={onClick}
        isLoading={isLoading}
        error={error}
        hasAccountLink={{
          text: "Нет аккаунта?",
          onClick: () => navigate("/register"),
        }}
        backButton={backButton}
      >
        {children}
      </LoginRegisterCard>
    </div>
  );
}
