import React, { useState } from 'react';
import MainForm from './components/MainForm';
import LoadingScreen from './components/LoadingScreen';
import './index.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <div className="App">
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      {!isLoading && <MainForm />}
    </div>
  );
}

export default App;
