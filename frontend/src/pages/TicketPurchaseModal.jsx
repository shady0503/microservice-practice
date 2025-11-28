import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { X, CheckCircle, Loader2, CreditCard, Ticket as TicketIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from '../config/api.config';
import axios from 'axios';

const TicketPurchaseModal = ({ isOpen, onClose, route, user }) => {
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
            // User.uuid comes from our helper in AuthContext
            const response = await axios.post(`${API_BASE_URL}/tickets`, {
                userId: user.uuid, 
                trajetId: route.routeId,
                quantity: quantity,
                metadata: { lineRef: route.lineRef, lineName: route.lineName }
            }, {
                headers: { 'Idempotency-Key': idempotencyKey }
            });

            setTicket(response.data);
            setStep('PAYMENT');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Reservation failed");
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
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <TicketIcon className="w-5 h-5 text-primary" />
                        {step === 'SUCCESS' ? 'Your Ticket' : 'Buy Ticket'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <AnimatePresence mode='wait'>
                        {step === 'SUMMARY' && (
                            <motion.div key="summary" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div className="text-sm text-blue-600 font-semibold mb-1">LINE {route.lineRef}</div>
                                        <div className="text-lg font-bold text-slate-800">{route.lineName}</div>
                                        <div className="text-sm text-slate-500 mt-1">Duration: ~{route.duration}</div>
                                    </div>

                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-slate-600">Price per ticket</span>
                                        <span className="font-semibold">{route.price} MAD</span>
                                    </div>

                                    <div className="flex items-center justify-between border-t pt-4">
                                        <span className="font-semibold">Quantity</span>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setQuantity(Math.max(1, q => q-1))} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold">-</button>
                                            <span className="w-4 text-center">{quantity}</span>
                                            <button onClick={() => setQuantity(Math.min(10, q => q+1))} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold">+</button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xl font-bold pt-2 border-t mt-2">
                                        <span>Total</span>
                                        <span className="text-primary">{totalPrice} MAD</span>
                                    </div>

                                    {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

                                    <Button onClick={handleReservation} className="w-full h-12 text-lg mt-4">
                                        Confirm Reservation
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'PROCESSING' && (
                            <motion.div key="processing" className="flex flex-col items-center justify-center py-10 space-y-4">
                                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                <p className="text-slate-500">Processing transaction...</p>
                            </motion.div>
                        )}

                        {step === 'PAYMENT' && (
                            <motion.div key="payment" initial={{opacity: 0}} animate={{opacity: 1}}>
                                <div className="text-center mb-6">
                                    <div className="text-sm text-slate-500">Amount to pay</div>
                                    <div className="text-3xl font-bold">{ticket?.price?.amount / 100} {ticket?.price?.currency}</div>
                                </div>
                                <div className="p-3 border rounded-lg flex items-center gap-3 cursor-pointer ring-2 ring-primary bg-primary/5 mb-6">
                                    <CreditCard className="w-6 h-6 text-primary" />
                                    <div className="flex-1">
                                        <div className="font-semibold">Credit Card</div>
                                        <div className="text-xs text-slate-500">**** 1234 (Mock)</div>
                                    </div>
                                    <div className="w-4 h-4 rounded-full bg-primary" />
                                </div>
                                {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded mb-4">{error}</div>}
                                <Button onClick={handlePayment} className="w-full h-12 text-lg">Pay Now</Button>
                            </motion.div>
                        )}

                        {step === 'SUCCESS' && (
                            <motion.div key="success" initial={{scale: 0.8, opacity: 0}} animate={{scale: 1, opacity: 1}} className="text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-10 h-10 text-green-600" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-1">Ticket Confirmed!</h3>
                                <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 inline-block mb-6 mt-4">
                                    <QRCodeSVG value={ticket?.id} size={150} />
                                    <div className="text-xs text-slate-400 mt-2 font-mono">{ticket?.id?.substring(0, 8)}...</div>
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