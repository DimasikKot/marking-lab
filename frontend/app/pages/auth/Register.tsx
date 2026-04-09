import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  registerUser,
  validateUsername,
  validateEmail,
} from "@/shared/api/user";
import { LoginRegisterCard } from "@/shared/components/LoginRegisterCard";
import { TextField } from "@/shared/components/TextField";

export function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (step === 1) {
      if (!username.trim()) {
        toast.error("Введите имя пользователя");
        return;
      }

      setIsLoading(true);
      const response = await validateUsername({ username });
      setIsLoading(false);

      if (response === undefined) {
        return;
      }

      setStep(2);
    } else if (step === 2) {
      if (!email) {
        toast.error("Введите электронную почту");
        return;
      }

      setIsLoading(true);
      const response = await validateEmail({ email });
      setIsLoading(false);

      if (response === undefined) {
        return;
      }

      setStep(3);
    } else if (step === 3) {
      if (!password) {
        toast.error("Введите пароль");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const response = await registerUser({ username, email, password });
      setTimeout(() => setIsLoading(false), 1000);

      if (response === undefined) {
        return;
      }

      toast.success("Вы успешно зарегистрировались");
      navigate("/");
    }
  };

  const handleBack = () => {
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
          <div className="relative">
            <span className="material-icons absolute -left-8 top-1/2 -translate-y-1/2 text-gray-600 text-2xl pointer-events-none">
              alternate_email
            </span>
            <TextField
              value={username}
              setValue={setUsername}
              placeholder="username"
              disabled={isLoading}
            />
          </div>
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
      subtitle:
        "Создайте надёжный пароль, используя комбинацию букв, цифр и символов",
      buttonText: "Зарегистрироваться",
      onClick: handleNext,
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
