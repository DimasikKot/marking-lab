import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { Text } from "@/shared/components/Text";
import { Files } from "./Files";
import { Experiments } from "./Experiments";
import { Models } from "./Models";

export function Project() {
  return (
    <Tabs>
      <TabList>
        <Tab>
          <Text variant="normal">Перейти в файлы</Text>
        </Tab>
        <Tab>
          <Text variant="normal">Перейти в эксперименты</Text>
        </Tab>
        <Tab>
          <Text variant="normal">Перейти в модели</Text>
        </Tab>
      </TabList>

      <TabPanel>
        <Files />
      </TabPanel>

      <TabPanel>
        <Experiments />
      </TabPanel>

      <TabPanel>
        <Models />
      </TabPanel>
    </Tabs>
  );
}
