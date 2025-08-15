import React, { useState } from "react";
import { MagnifyingGlassPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ReceiptPreviewProps {
  fileUrl: string;
  fileType: string;
  fileName?: string;
  className?: string;
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ fileUrl, fileType, fileName, className }) => {
  const [showZoom, setShowZoom] = useState(false);

  if (!fileUrl) return null;

  if (fileType.startsWith('image/')) {
    return (
      <div className={`relative mt-2 mx-auto mb-6 ${className || ''}`}>
        <img
          src={fileUrl}
          alt={fileName}
          className="rounded-lg object-contain border border-gray-200 dark:border-neutral-700 w-full max-w-full h-auto bg-gray-50 dark:bg-neutral-800 cursor-zoom-in"
          style={{ maxWidth: '100%', height: 'auto', maxHeight: '16rem' }}
          onClick={() => setShowZoom(true)}
        />
        <button
          type="button"
          className="absolute bottom-2 right-2 bg-white bg-opacity-90 rounded-full p-2 shadow hover:bg-opacity-100 focus:outline-none"
          onClick={() => setShowZoom(true)}
          aria-label="Zoom"
          style={{ lineHeight: 0 }}
        >
          <MagnifyingGlassPlusIcon className="w-6 h-6 text-gray-700" />
        </button>
        {showZoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setShowZoom(false)}>
            <div className="absolute top-4 right-4">
              <button
                className="text-white bg-black bg-opacity-80 rounded-full p-3 shadow-lg hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={() => setShowZoom(false)}
                aria-label="Close preview"
                style={{ fontSize: 0 }}
              >
                <XMarkIcon className="w-8 h-8" />
              </button>
            </div>
            <div className="relative max-w-full max-h-full p-4" onClick={e => e.stopPropagation()}>
              <img
                src={fileUrl}
                alt="Receipt large preview"
                className="rounded-lg object-contain border border-white shadow-lg max-w-full max-h-[80vh]"
                style={{ maxWidth: '90vw', maxHeight: '80vh' }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (fileType === 'application/pdf') {
    return (
      <div className={`mt-2 mb-6 rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 ${className || ''}`}>
        <iframe src={fileUrl} title={fileName} className="w-full h-64" />
      </div>
    );
  }

  return null;
};

export default ReceiptPreview;
