// frontend/src/pages/ScanPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { scanTicket } from '../services/ticket.service';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ScanPage = () => {
    const [scanResult, setScanResult] = useState(null); // null, 'SUCCESS', 'ERROR'
    const [message, setMessage] = useState('');
    const [ticketData, setTicketData] = useState(null);
    const scannerRef = useRef(null);

    useEffect(() => {
        // Initialize Scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0 
            },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
            }
        };
    }, []);

    const onScanSuccess = async (decodedText, decodedResult) => {
        if (scanResult) return; // Prevent multiple scans while processing

        // Pause scanning visually
        if (scannerRef.current) {
            scannerRef.current.pause();
        }

        try {
            const result = await scanTicket(decodedText);
            setTicketData(result);
            setScanResult('SUCCESS');
            setMessage('Ticket Valide !');
            // Play success sound if desired
        } catch (error) {
            console.error(error);
            setScanResult('ERROR');
            const errorMsg = error.response?.data?.message || "Ticket Invalide ou Erreur";
            setMessage(errorMsg);
        }
    };

    const onScanFailure = (error) => {
        // Handle scan failure, usually better to ignore to avoid console spam
    };

    const resetScan = () => {
        setScanResult(null);
        setMessage('');
        setTicketData(null);
        if (scannerRef.current) {
            scannerRef.current.resume();
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/10">
                <Link to="/dashboard">
                    <Button variant="ghost" className="text-white hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Retour
                    </Button>
                </Link>
                <h1 className="font-bold text-lg">Scanner de Ticket</h1>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                
                {/* Scanner Viewport */}
                <div className={`w-full max-w-sm overflow-hidden rounded-3xl border-4 shadow-2xl relative ${scanResult ? 'border-transparent' : 'border-white/20'}`}>
                    
                    {/* The HTML5-QRCode library renders here */}
                    <div id="reader" className={`${scanResult ? 'hidden' : 'block'} bg-black`}></div>

                    {/* Result Overlay */}
                    <AnimatePresence>
                        {scanResult && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center ${
                                    scanResult === 'SUCCESS' ? 'bg-green-600' : 'bg-red-600'
                                }`}
                            >
                                {scanResult === 'SUCCESS' ? (
                                    <CheckCircle className="w-24 h-24 text-white mb-4 animate-bounce" />
                                ) : (
                                    <XCircle className="w-24 h-24 text-white mb-4 animate-pulse" />
                                )}
                                
                                <h2 className="text-3xl font-bold mb-2">{message}</h2>
                                
                                {ticketData && (
                                    <div className="bg-white/20 rounded-xl p-4 w-full mt-4 backdrop-blur-sm">
                                        <p className="text-sm opacity-80">ID: {ticketData.id.split('-')[0]}</p>
                                        <p className="font-bold text-xl mt-1">{ticketData.price.amount / 100} MAD</p>
                                    </div>
                                )}

                                <Button onClick={resetScan} className="mt-8 bg-white text-black hover:bg-white/90 font-bold px-8 rounded-full shadow-lg">
                                    Scanner le suivant
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {!scanResult && (
                    <div className="mt-8 text-center text-white/50">
                        <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Placez le QR code dans le cadre</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanPage;