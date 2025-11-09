import { createContext, useContext, useState } from "react";

// Create Context
const TabsContext = createContext();

export function Tabs({ children, defaultValue }) {
  const [selectedTab, setSelectedTab] = useState(defaultValue || "");

  return (
    <TabsContext.Provider value={{ selectedTab, setSelectedTab }}>
      <div className="w-full">{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children }) {
  return <div className="flex border-b mb-4">{children}</div>;
}

export function TabsTrigger({ children, value }) {
  const { selectedTab, setSelectedTab } = useContext(TabsContext);
  const isActive = selectedTab === value;

  return (
    <button
      onClick={() => setSelectedTab(value)}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "border-b-2 border-blue-600 text-blue-600"
          : "text-gray-500 hover:text-blue-500"
      }`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }) {
  const { selectedTab } = useContext(TabsContext);
  return selectedTab === value ? <div className="mt-4">{children}</div> : null;
}
