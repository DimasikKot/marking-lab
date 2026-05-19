import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { Header } from "@/shared/components/Header";
import { fetchModelById, type ModelFullResponse } from "@/shared/api/model";
import { ButtonPage } from "@/shared/components/ButtonPage";
import { TextUI } from "@/shared/components/TextUI";

export function ComparisonModels() {
  const { projectId = "0" } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const ids_param: string = searchParams.get("ids") || "0,0";

  // Переменные страницы
  const [model1, setModel1] = useState<ModelFullResponse | null>(null);
  const [model2, setModel2] = useState<ModelFullResponse | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      const ids = ids_param
        .split(",") // Разделение на массив
        .map((id) => Number(id)) // Преобразование в число
        .slice(0, 2); // Максимум 2 модели

      setIsLoadingModels(true);
      const response1 = await fetchModelById(projectId, ids[0]);
      const response2 = await fetchModelById(projectId, ids[1]);
      setIsLoadingModels(false);
      if (response1 === undefined || response2 === undefined) return;
      setModel1(response1);
      setModel2(response2);
    };

    loadFiles();
  }, [projectId, ids_param]);

  return (
    <>
      <Header title="Сравнение моделей" />

      <div className="max-w-7xl mx-auto m-2">
        <ButtonPage onClick={() => window.history.back()} />

        <div className="mb-8 border border-gray-200 rounded-4xl p-6">
          {model1 && model2 ? (
            <div className="flex flex-col gap-6">
              <ModelInfoRow model1={model1} model2={model2} />
              {/* <ModelFilesRow model1={model1} model2={model2} /> */}
              <ModelParametersRow model1={model1} model2={model2} />
              <ModelMetricsRow model1={model1} model2={model2} />
              <ModelGraphsRow model1={model1} model2={model2} />
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
  model1,
  model2,
}: {
  model1: ModelFullResponse;
  model2: ModelFullResponse;
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="flex-1 h-full flex-col p-6 border border-gray-300 rounded-2xl">
        <div className="flex flex-row justify-between gap-4">
          <div className="flex w-full flex-row gap-2">
            <TextUI variant="title" maxLines={1} className="-mt-1">
              {model1.name}
            </TextUI>

            {model1.parameters["Базовая модель"] && (
              <TextUI
                variant="label"
                className="mt-0.75 h-min w-40 line-clamp-1"
              >
                {String(model1.parameters["Базовая модель"]).split("/").pop()}
              </TextUI>
            )}
          </div>

          {model1.progress !== 0 && model1.progress !== 100 && (
            <TextUI variant="normal" className="text-cyan-500 -mr-3">
              {`${model1.progress}%`}
            </TextUI>
          )}

          <div
            className={`flex items-center justify-center select-none material-icons
                        ${
                          model1.progress === 0
                            ? "text-amber-500"
                            : model1.progress !== 100
                              ? "text-cyan-500"
                              : "text-emerald-500"
                        }`}
          >
            {model1.progress === 0
              ? "edit_note"
              : model1.progress !== 100
                ? "model_training"
                : "school"}
          </div>
        </div>

        <div className="flex flex-col overflow-auto">
          {model1.training_files.length > 0 && (
            <TextUI variant="label">
              Файлы, на которых будет обучаться:{" "}
              <TextUI isSpan variant="desc">
                {model1.training_files.map((file) => file.name).join(" , ")}
              </TextUI>
            </TextUI>
          )}

          {model1.prediction_files.length > 0 && (
            <TextUI variant="label">
              Файлы, которые будут размечены:{" "}
              <TextUI isSpan variant="desc">
                {model1.prediction_files.map((file) => file.name).join(" , ")}
              </TextUI>
            </TextUI>
          )}
        </div>
      </div>

      <div className="flex-1 flex-col p-6 border border-gray-300 rounded-2xl">
        <div className="flex flex-row justify-between gap-4">
          <div className="flex w-full flex-row gap-2">
            <TextUI variant="title" maxLines={1} className="-mt-1">
              {model2.name}
            </TextUI>

            {model2.parameters["Базовая модель"] && (
              <TextUI
                variant="label"
                className="mt-0.75 h-min w-40 line-clamp-1"
              >
                {String(model2.parameters["Базовая модель"]).split("/").pop()}
              </TextUI>
            )}
          </div>

          {model2.progress !== 0 && model2.progress !== 100 && (
            <TextUI variant="normal" className="text-cyan-500 -mr-3">
              {`${model2.progress}%`}
            </TextUI>
          )}

          <div
            className={`flex items-center justify-center select-none material-icons
                        ${
                          model2.progress === 0
                            ? "text-amber-500"
                            : model2.progress !== 100
                              ? "text-cyan-500"
                              : "text-emerald-500"
                        }`}
          >
            {model2.progress === 0
              ? "edit_note"
              : model2.progress !== 100
                ? "model_training"
                : "school"}
          </div>
        </div>

        <div className="flex flex-col overflow-auto">
          {model2.training_files.length > 0 && (
            <TextUI variant="label">
              Файлы, на которых будет обучаться:{" "}
              <TextUI isSpan variant="desc">
                {model2.training_files.map((file) => file.name).join(" , ")}
              </TextUI>
            </TextUI>
          )}

          {model2.prediction_files.length > 0 && (
            <TextUI variant="label">
              Файлы, которые будут размечены:{" "}
              <TextUI isSpan variant="desc">
                {model2.prediction_files.map((file) => file.name).join(" , ")}
              </TextUI>
            </TextUI>
          )}
        </div>
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
//     <div className="grid md:grid-cols-2 gap-8">
//       <div className="flex flex-col p-6 border border-gray-300 rounded-2xl">
//         <TextUI variant="title" isSelectable className="h-50%">
//           Файлы, на которых будет обучаться:{" "}
//           <TextUI isSpan className="text-lg" isSelectable>
//             {model1.training_files.length > 0
//               ? model1.training_files.map((file) => file.name).join(" , ")
//               : "не выбраны"}
//           </TextUI>
//         </TextUI>

//         <TextUI variant="title" isSelectable className="h-50%">
//           Файлы, которые будут размечены:{" "}
//           <TextUI isSpan className="text-lg" isSelectable>
//             {model1.prediction_files.length > 0
//               ? model1.prediction_files.map((file) => file.name).join(" , ")
//               : "не выбраны"}
//           </TextUI>
//         </TextUI>
//       </div>

//       <div className="flex flex-col p-6 border border-gray-300 rounded-2xl">
//         <TextUI variant="title" isSelectable className="h-50%">
//           Файлы, на которых будет обучаться:{" "}
//           <TextUI isSpan className="text-lg" isSelectable>
//             {model2.training_files.length > 0
//               ? model2.training_files.map((file) => file.name).join(" , ")
//               : "не выбраны"}
//           </TextUI>
//         </TextUI>

//         <TextUI variant="title" isSelectable className="h-50%">
//           Файлы, которые будут размечены:{" "}
//           <TextUI isSpan className="text-lg" isSelectable>
//             {model2.prediction_files.length > 0
//               ? model2.prediction_files.map((file) => file.name).join(" , ")
//               : "не выбраны"}
//           </TextUI>
//         </TextUI>
//       </div>
//     </div>
//   );
// };

const ModelParametersRow = ({
  model1,
  model2,
}: {
  model1: ModelFullResponse;
  model2: ModelFullResponse;
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="p-6 border border-orange-200 bg-orange-50/20 rounded-2xl">
        <TextUI variant="header" className="mb-4 text-orange-400" isSelectable>
          Параметры обучения
        </TextUI>

        <div className="space-y-2">
          {Object.entries(model1.parameters).length > 0 &&
            Object.entries(model1.parameters).map(([k, v]) => (
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

      <div className="p-6 border border-orange-200 bg-orange-50/20 rounded-2xl">
        <TextUI variant="header" className="mb-4 text-orange-400" isSelectable>
          Параметры обучения
        </TextUI>

        <div className="space-y-2">
          {Object.entries(model2.parameters).length > 0 &&
            Object.entries(model2.parameters).map(([k, v]) => (
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
    </div>
  );
};

const ModelMetricsRow = ({
  model1,
  model2,
}: {
  model1: ModelFullResponse;
  model2: ModelFullResponse;
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {Object.entries(model1.metrics).length > 0 && (
        <div className="p-6 border border-emerald-300 bg-emerald-50/20 rounded-2xl">
          <TextUI
            variant="header"
            className="mb-4 text-emerald-500"
            isSelectable
          >
            Результаты обучения
          </TextUI>

          <div className="space-y-2">
            {Object.entries(model1.metrics).map(([k, v]) => (
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

      {Object.entries(model2.metrics).length > 0 && (
        <div className="p-6 border border-emerald-300 bg-emerald-50/20 rounded-2xl">
          <TextUI
            variant="header"
            className="mb-4 text-emerald-500"
            isSelectable
          >
            Результаты обучения
          </TextUI>

          <div className="space-y-2">
            {Object.entries(model2.metrics).map(([k, v]) => (
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

const ModelGraphsRow = ({
  model1,
  model2,
}: {
  model1: ModelFullResponse;
  model2: ModelFullResponse;
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {Object.entries(model1.graphs).map(([key, value]) => (
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

      {Object.entries(model2.graphs).map(([key, value]) => (
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
