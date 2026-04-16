import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { TextUI } from "@/shared/components/TextUI";
import { Header } from "@/shared/components/Header";
import { Files } from "./Files";
import { Experiments } from "./Experiments";
import { Models } from "./Models";

export function Project() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();

  // Определяем активную вкладку по текущему pathname
  const pathname = location.pathname;

  // Определяем индекс активной вкладки по пути
  let selectedIndex = 0; // по умолчанию — Файлы

  if (pathname.startsWith(`/projects/${projectId}/models`)) {
    selectedIndex = 1;
  } else if (pathname.startsWith(`/projects/${projectId}/experiments`)) {
    selectedIndex = 2;
  }

  // Обработчик смены вкладки — меняем URL
  const handleSelect = (index: number) => {
    let newPath = `/projects/${projectId}/files`;

    if (index === 1) newPath = `/projects/${projectId}/models`;
    else if (index === 2) newPath = `/projects/${projectId}/experiments`;

    navigate(newPath);
  };

  return (
    <div>
      <Tabs selectedIndex={selectedIndex} onSelect={handleSelect}>
        <Header>
          <TabList className="h-full">
            <div className="flex max-w-6xl mx-auto h-full items-end gap-12">
              {/* Файлы */}
              <Tab
                selectedClassName="active"
                className="group relative px-8 pb-2 hover:text-gray-900 transition-all duration-200 cursor-pointer outline-none"
              >
                <TextUI variant="normal" className="w-32 text-center">
                  Файлы
                </TextUI>
                <span className="absolute -bottom-px left-1/2 h-0.75 w-0 bg-black -translate-x-1/2 transition-discrete duration-300 group-[.active]:w-full" />
              </Tab>

              {/* Модели */}
              <Tab
                selectedClassName="active"
                className="group relative px-8 pb-2 hover:text-gray-900 transition-all duration-200 cursor-pointer outline-none"
              >
                <TextUI variant="normal" className="w-32 text-center">
                  Модели
                </TextUI>
                <span className="absolute -bottom-px left-1/2 h-0.75 w-0 bg-black -translate-x-1/2 transition-all duration-300 group-[.active]:w-full" />
              </Tab>

              {/* Эксперименты */}
              <Tab
                selectedClassName="active"
                className="group relative px-8 pb-2 text-gray-500 hover:text-gray-900 transition-all duration-200 cursor-pointer outline-none"
              >
                <TextUI variant="normal" className="w-32 text-center">
                  Эксперименты
                </TextUI>
                <span className="absolute -bottom-px left-1/2 h-0.75 w-0 bg-black -translate-x-1/2 transition-all duration-300 group-[.active]:w-full" />
              </Tab>
            </div>
          </TabList>
        </Header>

        <TabPanel>
          <Files />
        </TabPanel>

        <TabPanel>
          <Models />
        </TabPanel>

        <TabPanel>
          <Experiments />
        </TabPanel>
      </Tabs>
    </div>
  );
}
