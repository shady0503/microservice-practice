import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { 
    ArrowRight, Mail, Lock, User, Phone, 
    AlertCircle, Loader2, Eye, EyeOff, Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SignupPage = () => {
    const navigate = useNavigate();
    const { register } = useContext(AuthContext);
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    useEffect(() => {
        const pass = formData.password;
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        setPasswordStrength(score);
    }, [formData.password]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            setIsLoading(false);
            return;
        }

        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                password: formData.password
            });
            navigate('/dashboard');
        } catch (err) {
            console.error("Signup error:", err);
            setError(err.message || "Échec de l'inscription.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            {/* Simplified Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl p-6">
                    
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
                        <p className="text-sm text-slate-500 mt-1">Rejoignez UrbanMove en quelques secondes.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        id="firstName"
                                        type="text"
                                        placeholder="Prénom"
                                        className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        id="lastName"
                                        type="text"
                                        placeholder="Nom"
                                        className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-3">
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Email"
                                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    id="phoneNumber"
                                    type="tel"
                                    placeholder="Téléphone (+212...)"
                                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password Section */}
                        <div className="space-y-3 pt-1">
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mot de passe"
                                    className="w-full h-9 pl-9 pr-10 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Strength Indicator (Compact) */}
                            <div className="flex gap-1 h-1 px-1">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className={`flex-1 rounded-full transition-all ${i < passwordStrength ? (passwordStrength < 2 ? 'bg-red-400' : passwordStrength < 4 ? 'bg-yellow-400' : 'bg-green-500') : 'bg-slate-200'}`} />
                                ))}
                            </div>

                            <div className="relative">
                                <Check className={`absolute left-3 top-2.5 h-4 w-4 transition-colors ${formData.confirmPassword && formData.password === formData.confirmPassword ? 'text-green-500' : 'text-slate-400'}`} />
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Confirmer le mot de passe"
                                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Error & Submit */}
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 text-red-600 text-xs p-2.5 rounded-lg flex items-center gap-2 border border-red-100">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button type="submit" className="w-full h-10 text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all mt-2" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "S'inscrire"}
                            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-500">
                        Déjà inscrit ?{' '}
                        <Link to="/login" className="text-primary font-bold hover:underline">Se connecter</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SignupPage;