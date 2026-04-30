import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { TextUI } from "@/shared/components/TextUI";
import { Header } from "@/shared/components/Header";
import { FileEdit } from "./FileEdit";
import { FileLabel } from "./FileLabel";

export function File() {
  const { projectId = "0", fileId = "0" } = useParams();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") || "1";

  const navigate = useNavigate();
  const location = useLocation();

  // Определяем активную вкладку по текущему pathname
  const pathname = location.pathname;

  let selectedTab = 1;

  if (
    pathname.startsWith(
      `/projects/${projectId}/files/${fileId}?page=${page}&tab=edit`,
    )
  ) {
    selectedTab = 0;
  }

  // Обработчик смены вкладки — меняем URL
  const handleSelect = (index: number) => {
    let newTab = "edit";

    if (index === 1) newTab = "mark";

    navigate(
      `/projects/${projectId}/files/${fileId}?page=${page}&tab=${newTab}`,
    );
  };

  return (
    <div>
      <Tabs selectedIndex={selectedTab} onSelect={handleSelect}>
        <Header>
          <TabList className="h-full">
            <div className="flex h-full items-end gap-12">
              {/* Текст */}
              <Tab
                selectedClassName="active"
                className="group relative px-8 pb-2 hover:text-gray-900 transition-all duration-200 cursor-pointer outline-none"
              >
                <TextUI variant="normal" className="w-32 text-center">
                  Текст
                </TextUI>
                <span className="absolute -bottom-px left-1/2 h-0.75 w-0 bg-black -translate-x-1/2 transition-discrete duration-300 group-[.active]:w-full" />
              </Tab>

              {/* Разметка */}
              <Tab
                selectedClassName="active"
                className="group relative px-8 pb-2 hover:text-gray-900 transition-all duration-200 cursor-pointer outline-none"
              >
                <TextUI variant="normal" className="w-32 text-center">
                  Разметка
                </TextUI>
                <span className="absolute -bottom-px left-1/2 h-0.75 w-0 bg-black -translate-x-1/2 transition-all duration-300 group-[.active]:w-full" />
              </Tab>
            </div>
          </TabList>
        </Header>

        <TabPanel>
          <FileEdit projectId={projectId} fileId={fileId} page={page} />
        </TabPanel>

        <TabPanel>
          <FileLabel projectId={projectId} fileId={fileId} page={page} />
        </TabPanel>
      </Tabs>
    </div>
  );
}
