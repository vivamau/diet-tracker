import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Camera, ScanLine } from "lucide-react";
import { Button } from "./ui/button";

const BarcodeScanner = ({ onScan, onClose, onError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState("checking"); // 'checking', 'granted', 'denied', 'prompt'
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    checkCameraPermission();
    return () => {
      stopScanning();
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      // Check if camera permission is already granted
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({
          name: "camera",
        });
        console.log("Camera permission status:", permission.state);

        if (permission.state === "granted") {
          setPermissionStatus("granted");
          startScanning();
        } else if (permission.state === "denied") {
          setPermissionStatus("denied");
          setError(
            "Camera access has been denied. Please enable camera permissions in your browser settings and refresh the page."
          );
        } else {
          setPermissionStatus("prompt");
        }
      } else {
        // If permissions API is not available, try to request camera directly
        setPermissionStatus("prompt");
      }
    } catch (err) {
      console.error("Error checking camera permission:", err);
      setPermissionStatus("prompt");
    }
  };

  const requestCameraPermission = async () => {
    try {
      setError(null);
      setPermissionStatus("checking");

      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Permission granted, stop the test stream
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());

      setPermissionStatus("granted");
      startScanning();
    } catch (err) {
      console.error("Camera permission error:", err);
      setPermissionStatus("denied");

      let errorMessage = "Unable to access camera. ";

      if (err.name === "NotAllowedError") {
        errorMessage =
          "Camera access was denied. Please click 'Allow' when prompted or enable camera permissions in your browser settings.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (err.name === "NotReadableError") {
        errorMessage =
          "Camera is being used by another application. Please close other apps using the camera and try again.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage =
          "Camera doesn't support the required configuration. Try a different device.";
      } else if (
        window.location.protocol !== "https:" &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        errorMessage =
          "Camera requires HTTPS connection. Please use https:// or localhost.";
      } else {
        errorMessage =
          "Camera access failed. Please check your browser settings and try again.";
      }

      setError(errorMessage);
      if (onError) onError(err);
    }
  };

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Check for media devices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      // Initialize the barcode reader
      readerRef.current = new BrowserMultiFormatReader();

      // Get camera stream first
      const constraints = {
        video: {
          facingMode: { ideal: "environment" }, // Prefer back camera
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
        },
      };

      streamRef.current = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }

      // Get available video input devices for device selection
      const devices = await readerRef.current.listVideoInputDevices();
      console.log("Available cameras:", devices.length, devices);

      if (devices.length === 0) {
        throw new Error("No camera devices found");
      }

      // Find the best camera (prefer back camera)
      let selectedDevice = devices[0];
      const backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment")
      );
      if (backCamera) {
        selectedDevice = backCamera;
      }

      console.log("Selected camera:", selectedDevice.label);

      // Start barcode detection
      readerRef.current.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            console.log("Barcode detected:", result.text);
            onScan(result.text);
            stopScanning();
          }
          // Don't show errors for "not found" - this is expected during scanning
          if (err && err.name !== "NotFoundException") {
            console.warn("Scanning error:", err);
          }
        }
      );

      console.log("Camera stream started successfully");
    } catch (err) {
      console.error("Scanning start error:", err);
      setIsScanning(false);

      let errorMessage = "Failed to start camera scanning. ";

      if (err.name === "NotAllowedError") {
        errorMessage =
          "Camera permission denied. Please allow camera access and try again.";
        setPermissionStatus("denied");
      } else if (err.name === "NotFoundError") {
        errorMessage =
          "No camera found. Please connect a camera and try again.";
      } else if (err.name === "NotReadableError") {
        errorMessage =
          "Camera is busy. Please close other applications using the camera.";
      } else {
        errorMessage += err.message || "Please try again.";
      }

      setError(errorMessage);
      if (onError) onError(err);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      try {
        // Try to stop any ongoing decoding
        if (typeof readerRef.current.reset === "function") {
          readerRef.current.reset();
        }
      } catch (error) {
        console.error("Error stopping reader:", error);
      }
      readerRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  const handleRetry = () => {
    setError(null);
    if (permissionStatus === "denied" || permissionStatus === "prompt") {
      requestCameraPermission();
    } else {
      startScanning();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-md max-h-[600px] bg-black rounded-lg overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <ScanLine className="h-5 w-5" />
            <span className="font-medium">Scan Barcode</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Camera View */}
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scanning Overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Scanning frame */}
                <div className="w-64 h-64 border-2 border-white border-dashed rounded-lg relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>

                  {/* Scanning line animation */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-blue-500 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Permission Request State */}
        {permissionStatus === "prompt" && !error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
              <Camera className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Camera Permission Required
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                To scan barcodes, we need access to your camera. Click "Allow
                Camera" to grant permission.
              </p>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Button onClick={requestCameraPermission} className="flex-1">
                    Allow Camera
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1"
                  >
                    Manual Entry
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Use "Manual Entry" to type barcode numbers directly
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Checking Permission State */}
        {permissionStatus === "checking" && !error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">
                Checking Camera Access
              </h3>
              <p className="text-gray-600 text-sm">
                Please wait while we check camera permissions...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
              <Camera className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Camera Access Issue
              </h3>
              <p className="text-gray-600 mb-4 text-sm">{error}</p>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    className="flex-1"
                  >
                    {permissionStatus === "denied"
                      ? "Grant Permission"
                      : "Try Again"}
                  </Button>
                  <Button onClick={onClose} className="flex-1">
                    Manual Entry
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Use "Manual Entry" to type barcode numbers directly
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4 text-center">
          <p className="text-white text-sm">
            Position the barcode within the frame to scan
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
