import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { registerUser } from "@/shared/api/user";
import { LoginRegisterCard } from "@/shared/components/LoginRegisterCard";
import { TextField } from "@/shared/components/TextField";

export function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailVal = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailVal.test(email);
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!username.trim()) {
        toast.error("Введите имя пользователя");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!email) {
        toast.error("Введите электронную почту");
        return;
      }
      if (!validateEmail(email)) {
        toast.error("Некорректный формат email (пример: user@example.com)");
        return;
      }
      setStep(3);
    }
  };

  const handleRegister = async () => {
    setError(null);
    setIsLoading(true);

    if (!password) {
      toast.error("Введите пароль");
      setIsLoading(false);
      return;
    }

    const response = await registerUser({ username, email, password });

    setTimeout(() => setIsLoading(false), 1000);

    if (response === undefined) {
      /*Кароче тут должна быть обработка ошибки, но у нас она уже есть в user.ts 28 строка хз как лучше*/
      return;
    }

    toast.success("Вы успешно зарегистрировались");
    navigate("/");
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const getStepContent = () => {
    if (step === 1) {
      return {
        title: "Создайте свой аккаунт",
        subtitle: "Введите своё имя пользователя",
        buttonText: "Далее",
        onClick: handleNext,
        children: (
          <TextField
            value={username}
            setValue={setUsername}
            placeholder="@ username"
            disabled={isLoading}
          />
        ),
        backButton: undefined,
      };
    }
    if (step === 2) {
      return {
        title: "Введите свою почту",
        subtitle: "Введите почту для входа в свой аккаунт",
        buttonText: "Далее",
        onClick: handleNext,
        children: (
          <TextField
            type="email"
            value={email}
            setValue={setEmail}
            placeholder="Введите вашу электронную почту"
            disabled={isLoading}
          />
        ),
        backButton: { onClick: handleBack, text: "Назад" },
      };
    }
    return {
      title: "Создайте сложный пароль",
      subtitle: "Создайте надёжный пароль, используя комбинацию букв, цифр и символов",
      buttonText: "Зарегистрироваться",
      onClick: handleRegister,
      children: (
        <TextField
          type="password"
          value={password}
          setValue={setPassword}
          placeholder="Пароль"
          disabled={isLoading}
        />
      ),
      backButton: { onClick: handleBack, text: "Назад" },
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
          text: "Уже есть аккаунт?",
          onClick: () => navigate("/login"),
        }}
        backButton={backButton}
      >
        {children}
      </LoginRegisterCard>
    </div>
  );
}