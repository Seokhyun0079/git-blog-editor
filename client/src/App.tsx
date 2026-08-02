import { useState } from "react";
import PostPage from "./post/PostPage";
import SettingsPage from "./settings/SettingsPage";
import { hasConfig } from "./github";

function App() {
  const [configured, setConfigured] = useState(hasConfig());
  const [showSettings, setShowSettings] = useState(!hasConfig());

  if (!configured || showSettings) {
    return (
      <SettingsPage
        allowSkip={configured}
        onClose={configured ? () => setShowSettings(false) : undefined}
        onConfigured={() => {
          setConfigured(true);
          setShowSettings(false);
        }}
      />
    );
  }

  return <PostPage onOpenSettings={() => setShowSettings(true)} />;
}

export default App;
