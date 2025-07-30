import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let landmarker;

// Recibe {type:'init'} o {type:'frame', bitmap}
self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    ); // usa CD-N público :contentReference[oaicite:3]{index=3}
    landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: "/models/face_landmarker.task" },
      runningMode: "VIDEO",
    });
    postMessage({ type: "ready" });
  }

  if (data.type === "frame" && landmarker) {
    const { bitmap, timestamp } = data;
    const result = landmarker.detectForVideo(bitmap, timestamp);
    postMessage({ type: "result", result });
    bitmap.close(); // libera memoria
  }
};
