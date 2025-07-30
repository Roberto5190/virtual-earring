import { useRef } from 'react';
import CameraFeed from './components/CameraFeed'
import LandmarkDebugCanvas from './components/LandmarkDebugCanvas';
import './App.css'

function App() {
  const videoRef = useRef(null);

  return (
    <>
      <h1>Virtual Earring</h1>
      <div className='grid place-items-center h-screen'>
        <CameraFeed ref={videoRef} />
        <LandmarkDebugCanvas videoRef={videoRef} />
      </div>

    </>
  )
}

export default App
