import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { validateLogin, loginUser } from "@/shared/api/user";
import { LoginRegisterCard } from "@/shared/components/LoginRegisterCard";
import { TextField } from "@/shared/components/TextField";

export function Login() {
  const navigate = useNavigate();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (step === 1) {
      if (!login.trim()) {
        toast.error("Введите имя пользователя или email");
        return;
      }

      setIsLoading(true);
      const response = await validateLogin({ login });
      setIsLoading(false);

      if (response === undefined) {
        return;
      }

      setStep(2);
    } else if (step === 2) {
      if (!password) {
        toast.error("Введите пароль");
        return;
      }

      setIsLoading(true);
      const response = await loginUser({ login, password });
      setIsLoading(false);

      if (response === undefined) {
        return;
      }

      toast.success("Вы успешно вошли в аккаунт");
      navigate("/");
    }
  };

  const handleBack = () => {
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
            key={isLoading ? step + 10 : step}
            name="login"
            value={login}
            setValue={setLogin}
            onEnter={handleNext}
            onEscape={handleBack}
            autoFocus
            placeholder="Имя пользователя или email"
            disabled={isLoading}
          />
        ),
        backButton: undefined,
      };
    }
    return {
      title: "Введите пароль",
      subtitle: `Для аккаунта: ${login}`,
      buttonText: isLoading ? "Вход..." : "Войти",
      onClick: handleNext,
      children: (
        <TextField
          key={isLoading ? step + 10 : step}
          name="password"
          value={password}
          setValue={setPassword}
          onEnter={handleNext}
          onEscape={handleBack}
          autoFocus
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

  const { title, subtitle, buttonText, onClick, children, backButton } =
    getStepContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <LoginRegisterCard
        title={title}
        subtitle={subtitle}
        buttonText={buttonText}
        onButtonClick={onClick}
        isLoading={isLoading}
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
