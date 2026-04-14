import { useNavigate, useParams } from "react-router-dom";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Button } from "@/shared/components/Button";
import { Text } from "@/shared/components/Text";
export function Project() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  return (
    //Логика такая: Первый <Tab> соотносится с первым <TabPanel>
    <Tabs>
    <TabList>
      <Tab>
        <Text variant="normal">
          Перейти в файлы
        </Text>
      </Tab>
      <Tab>
        <Text variant="normal">
          Перейти в эксперименты
        </Text>
      </Tab>
      <Tab>
        <Text variant="normal">
          Перейти в модели
        </Text>
      </Tab>
    </TabList>

    <TabPanel>
      <h2><div>
      <p>Страница проекта</p>
      <Button
        onClick={() => {
          navigate(`/projects/${projectId}/files`);
        }}
        variant="primary"
      >
        Перейти в файлы проекта
      </Button>
    </div></h2>
    </TabPanel>
    <TabPanel>
      <h2>Any content 2</h2>
    </TabPanel>
  </Tabs>
  
);


}
