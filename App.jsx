import { useRef, useState } from 'react'
import './App.css'
import * as ttf from "@tensorflow/tfjs"
import * as facemesh from "@tensorflow-models/facemesh"
import Webcam from 'react-webcam'
import { drawMesh } from './utilities/utilities'

function App() {
  // set error state
  const [error, setError] = useState(null)

  // set  up references
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)

  // load the facemesh model
  const runFacemesh = async () => {
    const net = await facemesh.load({
      inputResolution: {
        width: 640,
        height: 480
      }, 
      scale: 0.8
    }) 

    setInterval(() => {
      detect(net)
    }, 100) // llamamos a la función detect y le pasamos net cada 100ms 

  }

  //  Detect function
  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" && //comprobamos si webcamRef es undefined
      webcamRef.current !== null && //comprobamos si webcamRef es null
      webcamRef.current.video.readyState === 4 //comprobamos si el video está listo
    ) {
      //  get video properties
      const video = webcamRef.current.video
      const videoWidth = video.videoWidth
      const videoHeight = video.videoHeight

      // Set video width
      webcamRef.current.video.width = videoWidth
      webcamRef.current.video.height = videoHeight

      // Set canvas width
      canvasRef.current.width = videoWidth
      canvasRef.current.height = videoHeight

      // Make detections
      const face = await net.estimateFaces(video)
      console.log(face)
      // Get canvas context for drawing
      const ctx = canvasRef.current.getContext("2d")
      drawMesh(face, ctx)

    } else{
      // If webcamRef is not ready or video is not available, log an error
      setError("Webcam is not ready or video is not available")
      console.error("webcamRef is not ready or video is not available")
    }
  }

  runFacemesh()
  return (
    <>
      <h1>Virtual Earring</h1>
      {error && <p className="error">{error}</p>}
      <Webcam ref={webcamRef}  className='absolute right-0 left-0 mx-auto'/>
      <canvas ref={canvasRef}  className='absolute right-0 left-0 mx-auto'/>
    </>
  )
}

export default App
