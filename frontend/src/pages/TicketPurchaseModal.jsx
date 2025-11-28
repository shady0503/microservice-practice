import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { X, CheckCircle, Loader2, CreditCard, Ticket as TicketIcon, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from '../config/api.config';
import axios from 'axios';

const TicketPurchaseModal = ({ isOpen, onClose, route, user, bus }) => {
    const [step, setStep] = useState('SUMMARY'); // SUMMARY, PROCESSING, PAYMENT, SUCCESS
    const [ticket, setTicket] = useState(null);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);

    if (!isOpen) return null;

    const totalPrice = (route.price * quantity).toFixed(2);

    const handleReservation = async () => {
        setStep('PROCESSING');
        setError(null);
        try {
            const idempotencyKey = uuidv4();
            const response = await axios.post(`${API_BASE_URL}/tickets`, {
                userId: user.uuid,
                trajetId: route.routeId,
                quantity: quantity,
                metadata: {
                    lineRef: route.lineRef,
                    lineName: route.lineName,
                    origin: route.originStop,
                    destination: route.destinationStop,
                    busId: bus?.busId,
                    busMatricule: bus?.busMatricule
                }
            }, {
                headers: { 'Idempotency-Key': idempotencyKey }
            });

            setTicket(response.data);
            setStep('PAYMENT');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Reservation failed. Please try again.");
            setStep('SUMMARY');
        }
    };

    const handlePayment = async () => {
        setStep('PROCESSING');
        try {
            const idempotencyKey = uuidv4();
            await axios.post(`${API_BASE_URL}/tickets/${ticket.id}/pay`, {
                paymentMethod: "CARD",
                cardNumber: "4242424242424242"
            }, {
                headers: { 'Idempotency-Key': idempotencyKey }
            });
            setStep('SUCCESS');
        } catch (err) {
            console.error(err);
            setError("Payment failed. Please try again.");
            setStep('PAYMENT');
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                        <TicketIcon className="w-5 h-5 text-primary" />
                        {step === 'SUCCESS' ? 'Ticket Confirmed' : 'Purchase Ticket'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <AnimatePresence mode='wait'>
                        {step === 'SUMMARY' && (
                            <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-bl-full opacity-50" />
                                        <div className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Bus Line</div>
                                        <div className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                                            {route.lineRef}
                                            <span className="text-base font-normal text-slate-500">/ {route.direction}</span>
                                        </div>
                                        <div className="text-sm text-slate-600 mt-2 font-medium">{route.lineName}</div>
                                        {bus && (
                                            <div className="mt-3 pt-3 border-t border-blue-200/50 flex items-center gap-2">
                                                <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">BUS</div>
                                                <span className="font-bold text-slate-700">{bus.busMatricule}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-dashed pt-4">
                                        <span className="font-semibold text-slate-700">Quantity</span>
                                        <div className="flex items-center gap-4 bg-slate-100 rounded-lg p-1">
                                            <button onClick={() => setQuantity(Math.max(1, q => q - 1))} className="w-8 h-8 rounded-md bg-white font-bold">-</button>
                                            <span className="w-6 text-center font-bold">{quantity}</span>
                                            <button onClick={() => setQuantity(Math.min(10, q => q + 1))} className="w-8 h-8 rounded-md bg-white font-bold">+</button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end pt-4 border-t">
                                        <span className="text-slate-500 mb-1">Total Amount</span>
                                        <span className="text-3xl font-bold text-primary">{totalPrice} MAD</span>
                                    </div>

                                    {error && <div className="text-red-500 text-sm">{error}</div>}

                                    <Button onClick={handleReservation} className="w-full h-12 text-lg font-bold shadow-lg">
                                        Confirm & Pay
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'PROCESSING' && (
                            <motion.div key="processing" className="flex flex-col items-center justify-center py-12 space-y-6">
                                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                <p className="text-slate-500 font-medium">Processing...</p>
                            </motion.div>
                        )}

                        {step === 'PAYMENT' && (
                            <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="text-center mb-8">
                                    <div className="text-sm text-slate-500 uppercase tracking-wide font-bold">Amount Due</div>
                                    <div className="text-4xl font-bold text-slate-900 mt-2">{ticket?.price?.amount / 100} MAD</div>
                                </div>

                                <div className="p-4 border-2 border-primary bg-primary/5 rounded-xl flex items-center gap-4 mb-8">
                                    <CreditCard className="w-6 h-6 text-primary" />
                                    <div className="flex-1 font-bold text-slate-800">Mock Card **** 4242</div>
                                </div>

                                {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
                                <Button onClick={handlePayment} className="w-full h-12 text-lg shadow-lg">Complete Payment</Button>
                            </motion.div>
                        )}

                        {step === 'SUCCESS' && (
                            <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                                <div className="flex justify-center mb-6">
                                    <CheckCircle className="w-20 h-20 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h3>

                                <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 inline-block mb-6">
                                    <QRCodeSVG value={ticket?.qrCodeData || ticket?.id} size={150} />
                                </div>

                                <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default TicketPurchaseModal;