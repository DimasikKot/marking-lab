import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Register() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {

    const response = await fetch(
      import.meta.env.VITE_BACKEND_URL + "/auth/user/",
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
    <div>

      <h1>Регистрация</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleRegister}>
        Зарегистрироваться
      </button>

    </div>
  );
}