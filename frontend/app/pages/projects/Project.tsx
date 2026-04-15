import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { Text } from "@/shared/components/Text";
import { Files } from "./Files";
import { Experiments } from "./Experiments";
import { Models } from "./Models";
import { Header } from "@/shared/components/Header";

export function Project() {
  return (
    <Tabs>
      <Header>Проект</Header>

      <TabList>
        <Tab>
          <Text variant="normal">Файлы</Text>
        </Tab>

        <Tab>
          <Text variant="normal">Модели</Text>
        </Tab>

        <Tab>
          <Text variant="normal">Эксперименты</Text>
        </Tab>
      </TabList>

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
  );
}
