import { useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";

import type { FileListResponse } from "@/shared/api/file";
import type { ProjectDbResponse } from "@/shared/api/projects";
import type { ModelListResponse } from "@/shared/api/model";
import { Header } from "@/shared/components/Header";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TextUI } from "@/shared/components/TextUI";
import { ButtonUI } from "@/shared/components/ButtonUI";
import { StatusIndicator } from "@/shared/components/StatusIndicator";
import { ProjectCard } from "@/shared/components/ProjectCard";
import { FileCard } from "@/shared/components/FileCard";
import { InfoCard } from "@/shared/components/InfoCard";
import { InfoCardBig } from "@/shared/components/InfoCardBig";
import { TextField } from "@/shared/components/TextField";
import { PageNavigate } from "@/shared/components/PageNavigate";
import { LoginRegisterCard } from "@/shared/components/LoginRegisterCard";
import { ModelCard } from "@/shared/components/ModelCard";
import { CheckboxUI } from "@/shared/components/CheckboxUI";

export function Components() {
  const navigate = useNavigate();
  const [textValue, setTextValue] = useState("");
  const [currentPage, setCurrentPage] = useState("1");
  const [checkboxValue, setCheckboxValue] = useState(false);

  const projects: ProjectDbResponse[] = [
    {
      id: 1,
      name: "NER определитель",
      description: "Самое крутое описание, чтобы не забыть, что за проект",
      is_public: true,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-03-20T15:30:00Z",
    },
    {
      id: 2,
      name: "NER 2",
      description: "Самое крутое",
      is_public: false,
      created_at: "2024-05-15T10:00:00Z",
      updated_at: "2024-06-20T15:30:00Z",
    },
  ];

  const files: FileListResponse[] = [
    {
      id: 1,
      name: "Собрание в Москве",
      total_rows: 100,
      is_labeled: false,
      origin_file: null,
      prediction_model: null,
      created_at: "2026-03-26T08:15:00.000Z",
      updated_at: "2026-03-28T09:45:00.000Z",
    },
    {
      id: 2,
      name: "Датасет 2003 года",
      total_rows: 23150,
      is_labeled: true,
      origin_file: null,
      prediction_model: null,
      created_at: "2026-05-26T08:15:00.000Z",
      updated_at: "2026-06-28T09:45:00.000Z",
    },
  ];

  const models: ModelListResponse[] = [
    {
      id: 2,
      name: "Классификатор BERT",
      progress: 0,
      parameters: {
        model: "bert",
        epochs: 3,
        batch_size: 4,
        learning_rate: 0.001,
      },
      metrics: {
        model: "bert",
        epochs: 8,
        batch_size: 40,
        learning_rate: 0.01,
        accuracy: 0.95,
        precision: 0.98,
        recall: 0.99,
        f1: 0.97,
        loss: 0.02,
        val_accuracy: 0.96,
        val_precision: 0.97,
        val_recall: 0.98,
        val_f1: 0.99,
        val_loss: 0.01,
      },
      training_files: [],
      prediction_files: [],
      created_at: "2024-02-01T09:00:00Z",
      updated_at: "2024-03-25T14:30:00Z",
    },
    {
      id: 2,
      name: "Вторая модель",
      progress: 70,
      parameters: {
        model: "ner",
        epochs: 3,
        batch_size: 4,
        learning_rate: 0.001,
        model2: "ner",
        epochs2: 3,
        batch_size2: 4,
        learning_rate2: 0.001,
      },
      metrics: {
        model: "ner lia",
        epochs: 8,
        batch_size: 40,
        learning_rate: 0.01,
      },
      training_files: [],
      prediction_files: [],
      created_at: "2026-04-24T02:05:34.752538",
      updated_at: "2026-04-24T22:34:30.828596",
    },
    {
      id: 3,
      name: "Вторая модель",
      progress: 100,
      parameters: {
        epochs: 3,
        batch_size: 4,
        learning_rate: 0.001,
      },
      metrics: {
        model: "ner lia",
        epochs: 8,
        batch_size: 40,
        learning_rate: 0.01,
      },
      training_files: [],
      prediction_files: [],
      created_at: "2026-04-24T02:05:34.752538",
      updated_at: "2026-04-24T22:34:30.828596",
    },
  ];

  return (
    <>
      <Header title="Компоненты" />

      <div className="max-w-6xl mx-auto m-6 mb-80 bg-white">
        <ButtonPage onClick={() => navigate("/")} />

        <div className="flex flex-col gap-16">
          {/* TextUI */}
          <div>
            <TextUI variant="header" className="mb-6">
              TextUI
            </TextUI>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-200">
                <TextUI variant="desc">desc (описание)</TextUI>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-200">
                <TextUI variant="label">label (метка)</TextUI>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-200">
                <TextUI variant="normal">normal (обычный)</TextUI>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-200">
                <TextUI variant="title">title (заголовок)</TextUI>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-200">
                <TextUI variant="logo">logo (логотип)</TextUI>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-200">
                <TextUI variant="header">header (большой заголовок)</TextUI>
              </div>
            </div>
          </div>

          {/* ButtonUI */}
          <div>
            <TextUI variant="header" className="mb-6">
              ButtonUI
            </TextUI>
            <div className="flex flex-wrap gap-4">
              <ButtonUI variant="primary">Primary Button</ButtonUI>
              <ButtonUI variant="secondary">Secondary Button</ButtonUI>
              <ButtonUI variant="link">Link Button</ButtonUI>
              <ButtonUI variant="primary" disabled>
                Primary Button Disabled
              </ButtonUI>
              <ButtonUI variant="secondary" disabled>
                Secondary Button Disabled
              </ButtonUI>
              <ButtonUI variant="link" disabled>
                Link Button Disabled
              </ButtonUI>
            </div>
          </div>

          {/*CheckboxUI */}
          <div>
            <TextUI variant="header" className="mb-6">
              CheckboxUI
            </TextUI>
            <div className="flex items-center gap-4">
              <CheckboxUI
                value={checkboxValue}
                title="Checked"
                onClick={() => setCheckboxValue(!checkboxValue)}
              />
              <CheckboxUI
                value={!checkboxValue}
                title="Unchecked"
                onClick={() => setCheckboxValue(!checkboxValue)}
              />
              <CheckboxUI
                value={checkboxValue}
                onClick={() => setCheckboxValue(!checkboxValue)}
              />
            </div>
          </div>

          {/* StatusIndicator */}
          <div>
            <TextUI variant="header" className="mb-6">
              StatusIndicator
            </TextUI>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <StatusIndicator status={true} />
                <TextUI variant="desc">Online (true)</TextUI>
              </div>
              <div className="flex items-center gap-3">
                <StatusIndicator status={false} />
                <TextUI variant="desc">Offline (false)</TextUI>
              </div>
            </div>
          </div>

          {/* ProjectCard */}
          <div>
            <TextUI variant="header" className="mb-6">
              ProjectCard
            </TextUI>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProjectCard project={projects[0]} />
              <ProjectCard project={projects[1]} dateIsCreatedAt={true} />
            </div>
          </div>

          {/* FileCard */}
          <div>
            <TextUI variant="header" className="mb-6">
              FileCard
            </TextUI>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FileCard file={files[0]} />
              <FileCard file={files[1]} dateIsCreatedAt={true} />
            </div>
          </div>

          {/* ModelCard */}
          <div>
            <TextUI variant="header" className="mb-6">
              ModelCard
            </TextUI>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModelCard model={models[0]} />
              <ModelCard model={models[1]} dateIsCreatedAt={true} />
              <ModelCard model={models[2]} />
              <ModelCard model={models[2]} dateIsCreatedAt={true} />
            </div>
          </div>

          {/* InfoCard */}
          <div>
            <TextUI variant="header" className="mb-6">
              InfoCard
            </TextUI>
            <div className="flex flex-wrap gap-6">
              <InfoCard
                icon="info"
                title="Информация"
                description="Это стандартная информационная карточка"
              />
              <InfoCard
                icon="check_circle"
                iconClassName="bg-green-100 text-green-600"
                title="Успешно"
                description="Операция выполнена успешно"
              />
            </div>
          </div>

          {/* InfoCardBig */}
          <div>
            <TextUI variant="header" className="mb-6">
              InfoCardBig
            </TextUI>
            <div className="flex flex-wrap gap-8">
              <InfoCardBig
                icon="add_circle"
                title="Новый проект"
                description="Создайте новый проект для разметки данных"
                buttonText="Создать проект"
                onClick={() => toast.success("Создание проекта")}
              />
              <InfoCardBig
                icon="upload_file"
                title="Загрузка файлов"
                description="Загрузите датасет для дальнейшей работы"
                buttonText="Загрузить файлы"
                onClick={() => toast.success("Загрузка файлов")}
              />
            </div>
          </div>

          {/* TextField */}
          <div>
            <TextUI variant="header" className="mb-6">
              TextField
            </TextUI>
            <div className="max-w-md space-y-6">
              <div>
                <TextUI variant="label" className="mb-1 block">
                  Обычное поле
                </TextUI>
                <TextField
                  value={textValue}
                  setValue={setTextValue}
                  placeholder="Введите текст..."
                />
              </div>

              <div>
                <TextUI variant="label" className="mb-1 block">
                  Многострочное поле
                </TextUI>
                <TextField
                  value={textValue}
                  setValue={setTextValue}
                  placeholder="Введите длинный текст..."
                  isArea
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* PageNavigate */}
          <div>
            <TextUI variant="header" className="mb-6">
              PageNavigate
            </TextUI>
            <PageNavigate
              currentPage={parseInt(currentPage)}
              totalPages={5}
              onBack={() =>
                setCurrentPage((prev) =>
                  String(Math.max(1, parseInt(prev) - 1)),
                )
              }
              onNext={() =>
                setCurrentPage((prev) =>
                  String(Math.min(5, parseInt(prev) + 1)),
                )
              }
            />
          </div>

          {/* LoginRegisterCard */}
          <div>
            <TextUI variant="header" className="mb-6">
              LoginRegisterCard
            </TextUI>
            <LoginRegisterCard
              title="Вход в аккаунт"
              subtitle="Введите данные для входа в систему"
              buttonText="Войти"
              onButtonClick={() => toast.success("Попытка входа")}
              descriptionLink={{
                text: "Нет аккаунта? Зарегистрироваться",
                onClick: () => toast.success("Переход на регистрацию"),
              }}
            >
              <div className="space-y-4">
                <TextField value="" setValue={() => {}} placeholder="Email" />
                <TextField
                  value=""
                  setValue={() => {}}
                  placeholder="Пароль"
                  type="password"
                />
              </div>
            </LoginRegisterCard>
          </div>
        </div>
      </div>
    </>
  );
}
