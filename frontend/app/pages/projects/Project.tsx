import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { useNavigate, useParams } from "react-router-dom";

import { TextUI } from "@/shared/components/TextUI";
import { Header } from "@/shared/components/Header";
import { Files } from "./Files";
import { Experiments } from "./Experiments";
import { Models } from "./Models";

export function Project() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  // const location = useLocation();

  // Определяем активную вкладку по текущему pathname
  // const pathname = location.pathname;

  // const isFilesActive = pathname.startsWith(`/projects/${projectId}/files`);
  // const isModelsActive = pathname.startsWith(`/projects/${projectId}/models`);
  // const isExperimentsActive = pathname.startsWith(
  //   `/projects/${projectId}/experiments`,
  // );

  return (
    <div>
      <Tabs>
        <Header>
          <TabList className="h-full">
            <div className="flex max-w-6xl mx-auto h-full items-end gap-12">
              {/* Файлы */}
              <Tab
                onClick={() => navigate(`/projects/${projectId}/files`)}
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
                onClick={() => navigate(`/projects/${projectId}/models`)}
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
                onClick={() => navigate(`/projects/${projectId}/experiments`)}
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
