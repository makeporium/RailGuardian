// src/components/ImageProcessor.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, X, Trash2, Loader2, UploadCloud, VideoOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ImageProcessorProps {
  onComplete: (imageUrls: string[]) => void;
  onClose: () => void;
  session: { id: string }; // The session is needed for the upload path
}

// Helper function to convert base64 data URL to a File object
async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: 'image/jpeg' });
}

export const ImageProcessor: React.FC<ImageProcessorProps> = ({ onComplete, onClose, session }) => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [cameraStatus, setCameraStatus] = useState<'loading' | 'on' | 'error'>('loading');
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let isCancelled = false;

        const initializeCamera = async () => {
            if (!videoRef.current) {
                // This can happen in rare cases if the component unmounts quickly.
                return;
            }
            setCameraStatus('loading');
            setErrorMessage(null);

            try {
                // 1. Get the camera stream
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });

                if (isCancelled) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                
                // 2. Attach the stream to the video element
                const video = videoRef.current;
                video.srcObject = stream;
                
                // 3. Wait for the stream to play
                // This promise resolves when the video has started playing.
                await video.play();

                // 4. Update the status to 'on' if everything succeeded
                if (!isCancelled) {
                    setCameraStatus('on');
                }

            } catch (err: any) {
                if (isCancelled) return;
                console.error("Camera initialization failed:", err);
                if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                    setErrorMessage("Camera access was denied. Please enable it in your browser settings.");
                } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                    setErrorMessage("No camera was found on your device.");
                } else {
                    setErrorMessage(`Could not start camera: ${err.name}. Check permissions or if another app is using it.`);
                }
                setCameraStatus('error');
            }
        };

        initializeCamera();

        // Cleanup function is crucial
        return () => {
            isCancelled = true;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // Empty dependency array ensures this runs only once on mount.

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current && cameraStatus === 'on') {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if(context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImages(prev => [...prev, dataUrl]);
            }
        }
    };

    const removePhoto = (index: number) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (capturedImages.length === 0) {
            toast({
                title: "No photos taken",
                description: "Please take at least one photo as proof.",
                variant: "destructive"
            });
            return;
        }

        setIsUploading(true);
        try {
            if (!user || !session) throw new Error("Authentication or session data missing.");
            
            const uploadPromises = capturedImages.map(async (dataUrl, index) => {
                const fileName = `${Date.now()}_${index + 1}.jpeg`;
                const filePath = `proofs/${user.id}/${session.id}/${fileName}`;
                const file = await dataUrlToFile(dataUrl, fileName);
                const { error: uploadError } = await supabase.storage.from('cleaningproofs').upload(filePath, file);
                if (uploadError) throw new Error(`Failed to upload image ${index + 1}: ${uploadError.message}`);
                const { data: urlData } = supabase.storage.from('cleaningproofs').getPublicUrl(filePath);
                return urlData.publicUrl;
            });
            
            const uploadedUrls = await Promise.all(uploadPromises);
            toast({ title: "Success", description: `${uploadedUrls.length} photos uploaded.` });
            onComplete(uploadedUrls);

        } catch (err: any) {
            console.error("Upload failed:", err);
            toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const renderCameraView = () => {
        return (
             <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <video 
                    ref={videoRef} 
                    playsInline 
                    muted // Muting is often required for autoplay to work
                    className={`w-full h-full object-contain transition-opacity duration-300 ${cameraStatus === 'on' ? 'opacity-100' : 'opacity-0'}`} 
                />
                 <canvas ref={canvasRef} className="hidden" />

                {cameraStatus === 'loading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                        <Loader2 className="w-12 h-12 animate-spin mb-4" />
                        <p>Starting camera...</p>
                    </div>
                )}
                {cameraStatus === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <VideoOff className="w-12 h-12 text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold text-red-400">Camera Error</h3>
                        <p className="text-red-300 text-sm">{errorMessage}</p>
                    </div>
                )}
            </div>
        )
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg bg-slate-900 border-slate-700 text-white flex flex-col max-h-[90vh]">
                <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
                    <CardTitle className="text-white flex items-center space-x-2">
                        <Camera className="w-5 h-5" />
                        <span>Submit Proof of Cleaning</span>
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4 overflow-y-auto flex-grow">
                    {renderCameraView()}

                    <Button onClick={takePhoto} className="w-full" disabled={cameraStatus !== 'on'}>
                        <Camera className="mr-2 h-4 w-4" /> Take Photo
                    </Button>

                    {capturedImages.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">Captured Photos ({capturedImages.length})</h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {capturedImages.map((imgSrc, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        <img src={imgSrc} alt={`Capture ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Button variant="destructive" size="icon" onClick={() => removePhoto(index)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
                <div className="p-6 border-t border-slate-700 flex-shrink-0">
                     <Button 
                        onClick={handleSubmit} 
                        className="w-full bg-emerald-600 hover:bg-emerald-700" 
                        disabled={isUploading || capturedImages.length === 0}
                    >
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        {isUploading ? 'Uploading...' : `Submit ${capturedImages.length} Photo(s)`}
                    </Button>
                </div>
            </Card>
        </div>
    );
};