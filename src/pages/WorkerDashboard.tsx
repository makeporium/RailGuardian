// src/pages/WorkerDashboard.tsx

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVerifyOtp, useMyOtps, useSubmitProof, useMyCleaningRecords } from '@/hooks/useOtp';
import { Input } from '@/components/ui/input';
import { QrCode, Upload, History, Camera, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ImageProcessor } from '@/components/ImageProcessor';
import { UserMenu } from '@/components/dashboard/UserMenu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRScanner } from '@/components/QRScanner'; // ✅ Import QRScanner

const WorkerDashboardPage = () => {
  const [otp, setOtp] = useState('');
  const { user } = useAuth();

  const { mutate: verifyOtp, isPending: isVerifyingOtp } = useVerifyOtp();
  const { data: myOtps, isLoading: isLoadingOtps } = useMyOtps();
  const { data: myRecords, isLoading: isLoadingRecords } = useMyCleaningRecords();
  const { mutate: submitProof, isPending: isSubmittingProof } = useSubmitProof();

  const [isImageProcessorOpen, setIsImageProcessorOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = (data: string | null) => {
    if (data) {
      const session = sortedOtps.find((s) => s.id === data);
      if (session) {
        setSelectedSession(session);
        setIsImageProcessorOpen(true);
      }
      setIsScanning(false);
    }
  };

  const handleUploadProofClick = (session: any) => {
    setSelectedSession(session);
    setIsImageProcessorOpen(true);
  };

  const handleProofComplete = (imageUrls: string[]) => {
    if (selectedSession) {
      submitProof({ session: selectedSession, imageUrls });
    }
    setIsImageProcessorOpen(false);
    setSelectedSession(null);
  };

  const handleProcessorClose = () => {
    setIsImageProcessorOpen(false);
    setSelectedSession(null);
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).replace(',', '');
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-600">Pending Review</Badge>;
      case 'approved': return <Badge className="bg-blue-600">Approved</Badge>;
      case 'verified': return <Badge className="bg-emerald-600">Verified</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const sortedOtps = useMemo(() => {
    if (!myOtps) return [];
    return [...myOtps].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [myOtps]);

  const sortedRecords = useMemo(() => {
    if (!myRecords) return [];
    return [...myRecords].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [myRecords]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Worker Dashboard</h1>
            <p className="text-slate-400">Welcome, {user?.email}</p>
          </div>
          <UserMenu />
        </header>

        <main>
          <Card className="mb-8 bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><QrCode /> Verify Cleaning Session</CardTitle>
              <CardDescription>Enter the OTP code found in the coach to start a cleaning session.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); if (otp.length > 0) { verifyOtp(otp); setOtp(''); } }} className="flex flex-col sm:flex-row items-center gap-4 w-full">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) setOtp(value);
                  }}
                  placeholder="Enter OTP here"
                  className="text-center sm:text-left"
                />
                <Button type="submit" disabled={isVerifyingOtp || otp.length === 0} className="w-full sm:w-auto">
                  {isVerifyingOtp ? 'Verifying...' : 'Verify & Start Session'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* ✅ Scan QR Button */}
          <div className="mb-4 flex justify-center">
            <Button onClick={() => setIsScanning(true)} variant="outline" className="text-white border-slate-500">
              <Camera className="w-4 h-4 mr-2" /> Scan QR
            </Button>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="active"><Upload className="w-4 h-4 mr-2" /> Active Sessions</TabsTrigger>
              <TabsTrigger value="history"><History className="w-4 h-4 mr-2" /> My Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>My Active Sessions</CardTitle>
                  <CardDescription>Submit proof of cleaning.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingOtps && <p>Loading sessions...</p>}
                  {!isLoadingOtps && (!sortedOtps || sortedOtps.length === 0) && <p>You have no active sessions. Enter an OTP to begin.</p>}
                  {sortedOtps && sortedOtps.length > 0 && (
                    <ul className="space-y-4">
                      {sortedOtps.map((session: any) => (
                        <li key={session.id} className="p-4 bg-slate-800 rounded-lg flex flex-col gap-3">
                          <div>
                            <p className="font-semibold">Train: {session?.coaches?.trains?.train_name ?? 'N/A'} ({session?.coaches?.trains?.train_number ?? 'N/A'})</p>
                            <p className="text-sm text-slate-400">Coach: {session?.coaches?.coach_number ?? 'N/A'}</p>
                            <p className="text-xs text-slate-600 mt-1">Session ID: {session.id}</p>
                          </div>
                          <Button
                            onClick={() => handleUploadProofClick(session)}
                            disabled={isSubmittingProof && selectedSession?.id === session.id}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {isSubmittingProof && selectedSession?.id === session.id ? 'Submitting...' : 'Submit Proof'}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>My Submission History</CardTitle>
                  <CardDescription>Status of your submitted cleaning proofs.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingRecords && <p>Loading history...</p>}
                  {!isLoadingRecords && (!sortedRecords || sortedRecords.length === 0) && <p>You have not submitted any proofs yet.</p>}
                  {sortedRecords && sortedRecords.length > 0 && (
                    <ul className="space-y-4">
                      {sortedRecords.map((record: any) => (
                        <li key={record.id} className="p-4 bg-slate-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">Train: {record?.washrooms?.coaches?.trains?.train_name ?? 'N/A'}</p>
                            <p className="text-sm text-slate-400">Location: {record?.washrooms?.location_description ?? 'N/A'}</p>
                            <p className="text-xs text-slate-500 mt-1">Submitted: {formatDateTime(record.created_at)}</p>
                          </div>
                          {getStatusBadge(record.approval_status)}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {isImageProcessorOpen && selectedSession && (
        <ImageProcessor
          onClose={handleProcessorClose}
          onComplete={handleProofComplete}
          session={selectedSession}
        />
      )}

      {isScanning && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-4 w-full max-w-sm relative">
            <Button onClick={() => setIsScanning(false)} className="absolute top-2 right-2" variant="destructive">
              <X className="w-4 h-4" />
            </Button>

            {/* ✅ Render the scanner */}
            <QRScanner
              onClose={() => setIsScanning(false)}
              onComplete={() => {
                setIsScanning(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboardPage;