import CameraFeed from './components/CameraFeed'
import { useRef } from 'react';
import useFaceLandmarks from './hooks/useFaceLandmarks';
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

    </>
  )
}

export default App
