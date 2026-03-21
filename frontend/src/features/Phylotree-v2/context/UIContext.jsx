import { createContext, useCallback, useContext, useState } from 'react';

const UIContext = createContext();

const defaultSettings = {
  width: 800,
  height: 600,
  showInternalLabels: false,
  alignTips: 'left',
  sort: null,
  horizontalSpacing: 20,
  verticalSpacing: 20
};

export const UIProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    setSearchTerm("");
    setSearchResults([]);
  }, []);

  return (
    <UIContext.Provider value={{ 
      settings, 
      updateSetting,
      resetSettings,
      searchTerm, 
      setSearchTerm,
      searchResults, 
      setSearchResults 
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);