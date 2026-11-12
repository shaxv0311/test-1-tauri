import {
  Mic,
  Square,
  Download,
  Trash2,
  Loader2,
  AudioLines,
} from "lucide-react";
import useAudioRecorder from "./useAudioRecorder";

const AudioRecorder = () => {
  const {
    isRecording,
    isLoading,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  const downloadRecording = () => {
    if (!audioBlob || !audioUrl) return;

    const extension = audioBlob.type.includes("mp4")
      ? "m4a"
      : audioBlob.type.includes("ogg")
        ? "ogg"
        : "webm";

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `recording-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <AudioLines size={24} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Audio Recorder
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Record and preview your audio
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center rounded-xl bg-gray-50 px-4 py-8 dark:bg-gray-800">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
            isRecording
              ? "animate-pulse bg-red-600 hover:bg-red-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isLoading ? (
            <Loader2 size={26} className="animate-spin" />
          ) : isRecording ? (
            <Square size={24} fill="currentColor" />
          ) : (
            <Mic size={28} />
          )}
        </button>

        <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-200">
          {isLoading
            ? "Requesting microphone permission..."
            : isRecording
              ? "Recording in progress..."
              : "Tap to start recording"}
        </p>

        {isRecording && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
            Recording
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {audioUrl && (
        <div className="mt-5 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Recorded Audio
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {((audioBlob?.size || 0) / 1024).toFixed(2)} KB
            </span>
          </div>

          <audio
            src={audioUrl}
            controls
            preload="metadata"
            className="w-full"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadRecording}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <Download size={16} />
              Download
            </button>

            <button
              type="button"
              onClick={clearRecording}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
