import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Camera, ScanLine } from "lucide-react";
import { Button } from "./ui/button";

const BarcodeScanner = ({ onScan, onClose, onError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

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

      // Get available video input devices
      const devices = await readerRef.current.listVideoInputDevices();
      console.log("Available cameras:", devices.length, devices);

      if (devices.length === 0) {
        throw new Error("No camera devices found");
      }

      // Prefer back camera on mobile, otherwise use first available
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

      // Use continuous scanning instead of single scan for better reliability
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
      console.error("Camera access error:", err);
      let errorMessage = "Unable to access camera. ";

      if (err.name === "NotAllowedError") {
        errorMessage +=
          "Please allow camera access when prompted and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera found on this device.";
      } else if (err.name === "NotReadableError") {
        errorMessage += "Camera is being used by another application.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage += "Camera doesn't support the required configuration.";
      } else if (err.message.includes("not supported")) {
        errorMessage += "Camera not supported in this browser.";
      } else if (
        window.location.protocol !== "https:" &&
        window.location.hostname !== "localhost"
      ) {
        errorMessage += "Camera requires HTTPS. Try using localhost or HTTPS.";
      } else {
        errorMessage += "Please check camera permissions and try again.";
      }

      setError(errorMessage);
      setIsScanning(false);
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
        // Stop any video streams
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject;
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleRetry = () => {
    setError(null);
    startScanning();
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
                    Try Again
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
