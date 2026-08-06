"use client";

import { useState } from "react";
import BarcodeScanner, { BarcodeStringFormat } from "react-qr-barcode-scanner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const GROCERY_FORMATS = [
  BarcodeStringFormat.EAN_13,
  BarcodeStringFormat.EAN_8,
  BarcodeStringFormat.UPC_A,
  BarcodeStringFormat.UPC_E,
];

export function BarcodeScannerModal({
  onScan,
  onClose,
}: {
  onScan: (barcode: string) => void;
  onClose: () => void;
}) {
  const [cameraError, setCameraError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-medium text-white">Scan a barcode</p>
        <button
          onClick={onClose}
          aria-label="Close scanner"
          className="rounded-full bg-white/10 p-1.5 text-white"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="relative flex-1">
        {cameraError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-white">
            <p className="text-sm">{cameraError}</p>
            <Button variant="outline" onClick={onClose}>
              Enter manually instead
            </Button>
          </div>
        ) : (
          <BarcodeScanner
            width="100%"
            height="100%"
            formats={GROCERY_FORMATS}
            onUpdate={(err, result) => {
              if (result) onScan(result.getText());
            }}
            onError={(err) =>
              setCameraError(
                typeof err === "string"
                  ? err
                  : "Couldn't access the camera. Check camera permissions for this site."
              )
            }
          />
        )}
      </div>
    </div>
  );
}
