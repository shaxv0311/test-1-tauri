import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  RefreshCw,
  Download,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

const CameraPreview = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      setError("");
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setFacingMode(mode);
      setCameraActive(true);
    } catch (err) {
      stopCamera();
      setError(err instanceof Error ? err.message : "Unable to access camera.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Camera is not ready. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture image.");
      return;
    }

    if (facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    setPhoto(canvas.toDataURL("image/jpeg", 0.92));
    setError("");
  };

  const switchCamera = () => {
    startCamera(facingMode === "environment" ? "user" : "environment");
  };

  const downloadPhoto = () => {
    if (!photo) return;

    const link = document.createElement("a");
    link.href = photo;
    link.download = `photo-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const clearPhoto = () => setPhoto(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <Camera size={24} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Take Photo
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Capture an image using your camera
          </p>
        </div>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-cover ${
            cameraActive ? "block" : "hidden"
          }`}
        />

        {!cameraActive && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
            <CameraOff size={42} />
            <p className="text-sm">Camera is not active</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!cameraActive ? (
          <button
            type="button"
            onClick={() => startCamera()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Camera size={18} />
            Open Camera
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={capturePhoto}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Camera size={18} />
              Capture Photo
            </button>

            <button
              type="button"
              onClick={switchCamera}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <RefreshCw size={18} />
              Switch
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </>
        )}
      </div>

      {photo && (
        <div className="mt-5 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Captured Image
            </h3>
          </div>

          <img
            src={photo}
            alt="Captured"
            className="w-full rounded-lg object-contain"
          />

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={downloadPhoto}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Download size={17} />
              Save Image
            </button>

            <button
              type="button"
              onClick={clearPhoto}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Trash2 size={17} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraPreview;
