import { useCallback, useEffect, useRef, useState } from "react";

type AudioRecorderState = {
  isRecording: boolean;
  isLoading: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
};

const getSupportedMimeType = (): string => {
  const types = [
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/webm",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Microphone permission denied. Please allow microphone access in your device settings.";

      case "NotFoundError":
        return "No microphone was found on this device.";

      case "NotReadableError":
        return "The microphone is unavailable or being used by another application.";

      case "SecurityError":
        return "Microphone access is blocked by the WebView security settings.";

      default:
        return error.message || "Unable to access microphone.";
    }
  }

  return error instanceof Error ? error.message : "Unable to record audio.";
};

const useAudioRecorder = () => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isLoading: false,
    audioBlob: null,
    audioUrl: null,
    error: null,
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mountedRef = useRef(false);
  const audioUrlRef = useRef<string | null>(null);

  const stopMicrophone = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;
  }, []);

  const releaseAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (recorderRef.current?.state === "recording") {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setState((previous) => ({
        ...previous,
        error: "Microphone API is unavailable in this WebView.",
      }));
      return;
    }

    if (!window.MediaRecorder) {
      setState((previous) => ({
        ...previous,
        error: "Audio recording is not supported by this WebView.",
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      isLoading: true,
      error: null,
    }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getSupportedMimeType();

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      recorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        if (mountedRef.current) {
          setState((previous) => ({
            ...previous,
            error: "An error occurred while recording audio.",
            isRecording: false,
          }));
        }

        stopMicrophone();
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        stopMicrophone();

        if (!mountedRef.current) {
          return;
        }

        if (blob.size === 0) {
          setState((previous) => ({
            ...previous,
            isRecording: false,
            isLoading: false,
            error: "No audio was recorded.",
          }));

          return;
        }

        releaseAudioUrl();

        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;

        setState((previous) => ({
          ...previous,
          isRecording: false,
          isLoading: false,
          audioBlob: blob,
          audioUrl: url,
          error: null,
        }));
      };

      recorder.start(250);

      setState((previous) => ({
        ...previous,
        isRecording: true,
        isLoading: false,
        audioBlob: null,
        audioUrl: null,
        error: null,
      }));
    } catch (error) {
      console.error("Microphone recording error:", error);

      stopMicrophone();

      if (mountedRef.current) {
        setState((previous) => ({
          ...previous,
          isRecording: false,
          isLoading: false,
          error: getErrorMessage(error),
        }));
      }
    }
  }, [releaseAudioUrl, stopMicrophone]);

  // Stop recording
  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  // Clear saved recording
  const clearRecording = useCallback(() => {
    releaseAudioUrl();

    setState((previous) => ({
      ...previous,
      audioBlob: null,
      audioUrl: null,
      error: null,
    }));
  }, [releaseAudioUrl]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const recorder = recorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.stop();
      }

      stopMicrophone();
      releaseAudioUrl();
    };
  }, [releaseAudioUrl, stopMicrophone]);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearRecording,
  };
};

export default useAudioRecorder;
