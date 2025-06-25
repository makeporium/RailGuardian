// src/components/QRScanner.tsx

import React, { useState } from 'react';
import { QrReader } from '@blackbox-vision/react-qr-reader';
import { Button } from '@/components/ui/button';
import { OTPScanner } from './OTPScanner';
import { QRVerification } from './QRVerification';

interface QRScannerProps {
  onClose: () => void;
  onComplete: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onClose, onComplete }) => {
  const [mode, setMode] = useState<'idle' | 'qr' | 'otp'>('idle');
  const [qrToken, setQrToken] = useState<string | null>(null);

  const handleScan = (result: string | null) => {
    if (result) {
      console.log('QR Scanned Text:', result);
      setQrToken(result);
      setMode('qr');
    }
  };

  if (mode === 'otp') {
    return <OTPScanner onClose={onClose} onComplete={onComplete} />;
  }

  if (mode === 'qr' && qrToken) {
    return (
      <QRVerification
        qrToken={qrToken}
        onClose={onClose}
        onComplete={onComplete}
        onFallback={() => setMode('otp')}
      />
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <QrReader
        constraints={{ facingMode: 'environment' }}
        onResult={(result, error) => {
          if (result) handleScan(result.getText());
          if (error) console.error('QR Scanner Error:', error);
        }}
        containerStyle={{ width: '100%' }}
        videoStyle={{ width: '100%' }}
      />
      <div className="flex justify-between mt-4">
        <Button onClick={() => setMode('otp')} className="bg-blue-500 text-white px-4 py-2 rounded">
          Enter OTP Instead
        </Button>
        <Button onClick={onClose} className="bg-red-500 text-white px-4 py-2 rounded">
          Close
        </Button>
      </div>
    </div>
  );
};
