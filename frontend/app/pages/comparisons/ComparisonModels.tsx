import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { Header } from "@/shared/components/Header";
import { fetchModelById, type ModelFullResponse } from "@/shared/api/model";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TextUI } from "@/shared/components/TextUI";
import React from "react";

export function ComparisonModels() {
  const navigate = useNavigate();
  const { projectId = "0" } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const ids_param: string = searchParams.get("ids") || "";

  // Переменные страницы
  const [models, setModels] = useState<ModelFullResponse[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      const ids = ids_param
        .split(",")
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id) && id > 0);

      if (ids.length === 0) {
        setModels([]);
        return;
      }

      setIsLoadingModels(true);

      const responses = await Promise.all(
        ids.map((id) => fetchModelById(projectId, id)),
      );

      const validModels = responses.filter(
        (model): model is ModelFullResponse => model !== undefined,
      );

      setModels(validModels);
      setIsLoadingModels(false);

      const hasTrainingModels = validModels.some(
        (model) => model.progress > 0 && model.progress < 100,
      );

      if (!hasTrainingModels) {
        clearInterval(interval);
      }
    };

    loadModels();

    const interval = setInterval(() => {
      loadModels();
    }, 5000);

    return () => clearInterval(interval);
  }, [projectId, ids_param]);

  return (
    <>
      <Header title="Сравнение моделей" />

      <div
        className={`${models.length > 2 ? "max-w-10/12" : "max-w-6xl"} mx-auto m-6 mb-80`}
      >
        <ButtonPage
          onClick={() => navigate(`/projects/${projectId}?tab=models`)}
        />

        <div className="mb-8 border border-gray-200 rounded-4xl p-6">
          {models.length > 0 ? (
            <div className="flex flex-col gap-6">
              <ModelInfoRow models={models} projectId={projectId} />
              <ModelParametersRow models={models} />
              <ModelMetricsRow models={models} />
              <ModelGraphsRow models={models} />
            </div>
          ) : isLoadingModels ? (
            <TextUI>Загрузка...</TextUI>
          ) : (
            <TextUI>Файлы не найдены</TextUI>
          )}
        </div>
      </div>
    </>
  );
}

const ModelInfoRow = ({
  models,
  projectId,
}: {
  models: ModelFullResponse[];
  projectId: string;
}) => {
  return (
    <div
      className="w-full grid gap-8 sticky sm:top-47 lg:top-15 self-start"
      style={{
        gridTemplateColumns: `repeat(${models.length}, minmax(0, 1fr))`,
      }}
    >
      {models.map((model) => (
        <ModelInfoElement key={model.id} model={model} projectId={projectId} />
      ))}
    </div>
  );
};

const ModelInfoElement = ({
  model,
  projectId,
}: {
  model: ModelFullResponse;
  projectId: string;
}) => {
  return (
    <div className="flex-1 flex-col p-4 -m-2 border border-gray-300 rounded-2xl bg-white">
      <div className="flex flex-row justify-between gap-4">
        <div className="flex w-full flex-row gap-2">
          <TextUI variant="title" maxLines={1} className="-mt-1">
            {model.name}
          </TextUI>

          {model.parameters["Базовая модель"] && (
            <TextUI variant="label" className="mt-0.75 h-min w-40 line-clamp-1">
              {String(model.parameters["Базовая модель"]).split("/").pop()}
            </TextUI>
          )}
        </div>

        {model.progress !== 0 && model.progress !== 100 && (
          <TextUI variant="normal" className="text-cyan-500 -mr-3">
            {`${model.progress}%`}
          </TextUI>
        )}

        <div
          className={`flex items-center justify-center select-none material-icons
                      ${
                        model.progress === 0
                          ? "text-amber-500"
                          : model.progress !== 100
                            ? "text-cyan-500"
                            : "text-emerald-500"
                      }
                    `}
        >
          {model.progress === 0
            ? "edit_note"
            : model.progress !== 100
              ? "model_training"
              : "school"}
        </div>
      </div>

      <div className="flex flex-col overflow-auto">
        {model.training_files.length > 0 && (
          <TextUI variant="label">
            Файлы, на которых будет обучаться:{" "}
            <TextUI isSpan variant="label">
              {model.training_files.map((file, index) => (
                <React.Fragment key={file.id}>
                  <TextUI variant="link" isSpan isSelectable>
                    <Link to={`/projects/${projectId}/files/${file.id}`}>
                      {file.name}
                    </Link>
                  </TextUI>

                  {index < model.training_files.length - 1 && ", "}
                </React.Fragment>
              ))}
            </TextUI>
          </TextUI>
        )}

        {model.prediction_files.length > 0 && (
          <TextUI variant="label">
            Файлы, которые будут размечены:{" "}
            <TextUI isSpan variant="label">
              {model.prediction_files.map((file, index) => (
                <React.Fragment key={file.id}>
                  <TextUI variant="link" isSpan isSelectable>
                    <Link to={`/projects/${projectId}/files/${file.id}`}>
                      {file.name}
                    </Link>
                  </TextUI>

                  {index < model.prediction_files.length - 1 && ", "}
                </React.Fragment>
              ))}
            </TextUI>
          </TextUI>
        )}
      </div>
    </div>
  );
};

// depricated
// const ModelFilesRow = ({
//   model1,
//   model2,
// }: {
//   model1: ModelFullResponse;
//   model2: ModelFullResponse;
// }) => {
//   return (
//     <div className="grid grid-cols-2 gap-8">
//       <ModelFilesElement model={model1} />
//       <ModelFilesElement model={model2} />
//     </div>
//   );
// };

// const ModelFilesElement = ({ model }: { model: ModelFullResponse }) => {
//   return (
//     <div className="flex flex-col p-6 border border-gray-300 rounded-2xl">
//       <TextUI variant="title" isSelectable className="h-50%">
//         Файлы, на которых будет обучаться:{" "}
//         <TextUI isSpan className="text-lg" isSelectable>
//           {model.training_files.length > 0
//             ? model.training_files.map((file) => file.name).join(" , ")
//             : "не выбраны"}
//         </TextUI>
//       </TextUI>

//       <TextUI variant="title" isSelectable className="h-50%">
//         Файлы, которые будут размечены:{" "}
//         <TextUI isSpan className="text-lg" isSelectable>
//           {model.prediction_files.length > 0
//             ? model.prediction_files.map((file) => file.name).join(" , ")
//             : "не выбраны"}
//         </TextUI>
//       </TextUI>
//     </div>
//   );
// };

const ModelParametersRow = ({ models }: { models: ModelFullResponse[] }) => {
  return (
    <div
      className="grid gap-8"
      style={{
        gridTemplateColumns: `repeat(${models.length}, minmax(0, 1fr))`,
      }}
    >
      {models.map((model) => (
        <ModelParametersElement key={model.id} model={model} />
      ))}
    </div>
  );
};

const ModelParametersElement = ({ model }: { model: ModelFullResponse }) => {
  return (
    <div className="p-6 border border-orange-200 bg-orange-50/20 rounded-2xl">
      <TextUI variant="header" className="mb-4 text-orange-400" isSelectable>
        Параметры обучения
      </TextUI>

      <div className="space-y-2">
        {Object.entries(model.parameters).length > 0 &&
          Object.entries(model.parameters).map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between py-1 border-b border-orange-200"
            >
              <TextUI
                variant="subtitle"
                className="text-orange-400 w-[45%] overflow-hidden"
                isSelectable
              >
                {k}
              </TextUI>

              <TextUI
                className="text-orange-400 w-[50%] overflow-hidden"
                isSpan
                isSelectable
              >
                {String(v)}
              </TextUI>
            </div>
          ))}
      </div>
    </div>
  );
};

const ModelMetricsRow = ({ models }: { models: ModelFullResponse[] }) => {
  return (
    <div
      className="grid gap-8"
      style={{
        gridTemplateColumns: `repeat(${models.length}, minmax(0, 1fr))`,
      }}
    >
      {models.map((model) => (
        <ModelMetricsElement key={model.id} model={model} />
      ))}
    </div>
  );
};

const ModelMetricsElement = ({ model }: { model: ModelFullResponse }) => {
  return (
    <div>
      {Object.entries(model.metrics).length > 0 && (
        <div className="p-6 border border-emerald-300 bg-emerald-50/20 rounded-2xl">
          <TextUI
            variant="header"
            className="mb-4 text-emerald-500"
            isSelectable
          >
            Результаты обучения
          </TextUI>

          <div className="space-y-2">
            {Object.entries(model.metrics).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between py-1 border-b border-emerald-300"
              >
                <TextUI
                  variant="subtitle"
                  className="text-emerald-500 w-[45%] overflow-hidden"
                  isSelectable
                >
                  {k}
                </TextUI>

                <TextUI
                  className="text-emerald-500 w-[50%] overflow-hidden"
                  isSpan
                  isSelectable
                >
                  {String(v)}
                </TextUI>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ModelGraphsRow = ({ models }: { models: ModelFullResponse[] }) => {
  return (
    <div
      className="grid gap-8"
      style={{
        gridTemplateColumns: `repeat(${models.length}, minmax(0, 1fr))`,
      }}
    >
      {models.map((model) => (
        <ModelGraphsElement key={model.id} model={model} />
      ))}
    </div>
  );
};

const ModelGraphsElement = ({ model }: { model: ModelFullResponse }) => {
  return (
    <div className="space-y-6">
      {Object.entries(model.graphs).map(([key, value]) => (
        <div key={key} className="border rounded-2xl p-3">
          <TextUI className="mb-2" isSelectable>
            {key}
          </TextUI>

          <img
            src={value}
            alt={key}
            className="w-full select-none rounded-lg"
          />
        </div>
      ))}
    </div>
  );
};
