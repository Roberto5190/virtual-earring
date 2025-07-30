import { useRef } from 'react';
import CameraFeed from './components/CameraFeed'
import LandmarkDebugCanvas from './components/LandmarkDebugCanvas';
import './App.css'

function App() {
  const videoRef = useRef(null);
  const landmarks = useFaceLandmarks(videoRef);

  return (
    <>
      <h1>Virtual Earring</h1>
      <div className='grid place-items-center h-screen'>
        <CameraFeed ref={videoRef} />
      </div>
      <LandmarkDebugCanvas videoRef={videoRef} />
    </>
  )
}

export default App
