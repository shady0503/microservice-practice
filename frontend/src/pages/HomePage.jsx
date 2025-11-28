import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import {
    MapPin,
    Ticket,
    Smartphone,
    ArrowRight,
    Clock,
    Shield,
    Users,
    Bus,
    CheckCircle,
    CreditCard,
    Navigation
} from 'lucide-react';

const HomePage = () => {
    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    const containerStagger = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-10">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background z-10" />
                    {/* Abstract Background Elements */}
                    <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl opacity-30" />
                </div>

                <div className="container relative z-20 px-4 md:px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-8 max-w-4xl mx-auto"
                    >
                        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4 border border-primary/20">
                            Le futur de la mobilité est ici
                        </div>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 leading-[1.1]">
                            L'élégance de la <br className="hidden md:block" /> mobilité urbaine.
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-[700px] mx-auto leading-relaxed">
                            Planifiez, réservez et voyagez en toute simplicité. Une expérience de transport public repensée pour le voyageur moderne.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                            <Button size="lg" className="text-lg px-8 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                                Commencer maintenant <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button variant="outline" size="lg" className="text-lg px-8 h-14 rounded-full border-2 hover:bg-secondary/50 backdrop-blur-sm">
                                Découvrir les offres
                            </Button>
                        </div>
                    </motion.div>

                    {/* Hero Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-10 border-t border-border/40 max-w-5xl mx-auto"
                    >
                        <StatItem number="10k+" label="Voyageurs Quotidiens" />
                        <StatItem number="500+" label="Bus Connectés" />
                        <StatItem number="98%" label="Ponctualité" />
                        <StatItem number="24/7" label="Support Client" />
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-32 bg-secondary/30 relative">
                <div className="container px-4 md:px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Tout ce dont vous avez besoin</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Une suite complète de fonctionnalités pour rendre vos déplacements plus fluides et agréables.
                        </p>
                    </div>

                    <motion.div
                        variants={containerStagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        <FeatureCard
                            icon={<Clock className="h-10 w-10 text-blue-500" />}
                            title="Temps Réel"
                            description="Suivez votre bus à la seconde près. Plus d'attente inutile à l'arrêt, vous savez exactement quand partir."
                        />
                        <FeatureCard
                            icon={<CreditCard className="h-10 w-10 text-purple-500" />}
                            title="Billetterie Sans Contact"
                            description="Achetez vos titres en un clic. Validez avec votre smartphone via QR Code ou NFC. Simple et sécurisé."
                        />
                        <FeatureCard
                            icon={<Navigation className="h-10 w-10 text-green-500" />}
                            title="Itinéraires Intelligents"
                            description="Notre algorithme calcule le trajet optimal en combinant bus, tram et marche pour vous faire gagner du temps."
                        />
                        <FeatureCard
                            icon={<Shield className="h-10 w-10 text-red-500" />}
                            title="Paiement Sécurisé"
                            description="Vos transactions sont chiffrées et sécurisées. Gérez votre portefeuille et vos abonnements en toute confiance."
                        />
                        <FeatureCard
                            icon={<Users className="h-10 w-10 text-orange-500" />}
                            title="Communauté"
                            description="Signalez les incidents et partagez l'état du trafic avec la communauté pour une information toujours à jour."
                        />
                        <FeatureCard
                            icon={<Bus className="h-10 w-10 text-teal-500" />}
                            title="Flotte Moderne"
                            description="Profitez de véhicules confortables, équipés de Wi-Fi et de prises USB pour rester connecté."
                        />
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-32 bg-background">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            {...fadeInUp}
                            className="space-y-8"
                        >
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Voyager n'a jamais été aussi simple</h2>
                            <p className="text-xl text-muted-foreground">
                                Trois étapes simples pour prendre le contrôle de vos déplacements urbains.
                            </p>

                            <div className="space-y-8 pt-4">
                                <StepItem
                                    number="01"
                                    title="Recherchez votre trajet"
                                    description="Entrez votre destination et choisissez l'itinéraire qui vous convient le mieux parmi nos suggestions."
                                />
                                <StepItem
                                    number="02"
                                    title="Obtenez votre ticket"
                                    description="Achetez votre titre de transport directement dans l'application. Pas de queue, pas de monnaie."
                                />
                                <StepItem
                                    number="03"
                                    title="Montez à bord"
                                    description="Scannez votre QR code à la montée et installez-vous confortablement. On s'occupe du reste."
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative h-[600px] bg-gradient-to-br from-primary/5 to-secondary/30 rounded-3xl border border-border/50 overflow-hidden flex items-center justify-center"
                        >
                            {/* Abstract Phone UI Representation */}
                            <div className="w-[300px] h-[550px] bg-background border-8 border-muted rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
                                <div className="h-8 bg-muted w-full absolute top-0 left-0 z-20 flex justify-center items-center">
                                    <div className="w-20 h-4 bg-background rounded-full mt-2" />
                                </div>
                                <div className="flex-1 bg-muted/10 p-6 pt-12 space-y-4">
                                    <div className="h-8 w-3/4 bg-primary/20 rounded animate-pulse" />
                                    <div className="h-32 w-full bg-secondary/50 rounded-xl animate-pulse delay-75" />
                                    <div className="h-32 w-full bg-secondary/50 rounded-xl animate-pulse delay-150" />
                                    <div className="h-12 w-1/2 bg-primary rounded-full mt-auto mx-auto animate-pulse delay-200" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 z-0" />
                <div className="container relative z-10 px-4 md:px-6 text-center">
                    <motion.div
                        {...fadeInUp}
                        className="max-w-3xl mx-auto space-y-8 p-12 bg-background/50 backdrop-blur-xl rounded-3xl border border-primary/10 shadow-2xl"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Prêt à transformer vos déplacements ?</h2>
                        <p className="text-xl text-muted-foreground">
                            Rejoignez des milliers d'utilisateurs satisfaits et redécouvrez votre ville dès aujourd'hui.
                        </p>
                        <div className="pt-4">
                            <Link to="/signup">
                                <Button size="lg" className="text-lg px-10 h-14 rounded-full shadow-xl hover:scale-105 transition-transform duration-300">
                                    Créer un compte gratuit
                                </Button>
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground pt-4">
                            Disponible sur iOS et Android. Aucun abonnement requis pour commencer.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-border/40 bg-background">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <h3 className="text-xl font-bold mb-4">UrbanMoveMS</h3>
                            <p className="text-muted-foreground">
                                La mobilité urbaine, simplifiée et élégante.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Produit</h4>
                            <ul className="space-y-2 text-muted-foreground">
                                <li>Fonctionnalités</li>
                                <li>Tarifs</li>
                                <li>Entreprises</li>
                                <li>Mises à jour</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Ressources</h4>
                            <ul className="space-y-2 text-muted-foreground">
                                <li>Aide</li>
                                <li>Blog</li>
                                <li>Contact</li>
                                <li>Confidentialité</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Social</h4>
                            <ul className="space-y-2 text-muted-foreground">
                                <li>Twitter</li>
                                <li>Instagram</li>
                                <li>LinkedIn</li>
                            </ul>
                        </div>
                    </div>
                    <div className="text-center text-muted-foreground text-sm pt-8 border-t border-border/40">
                        <p>&copy; {new Date().getFullYear()} UrbanMoveMS. Tous droits réservés. Fait avec ❤️ pour la ville.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const StatItem = ({ number, label }) => (
    <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{number}</div>
        <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
    </div>
);

const FeatureCard = ({ icon, title, description }) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
            }}
            className="group p-8 rounded-3xl bg-background border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
            <div className="p-4 bg-secondary rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
};

const StepItem = ({ number, title, description }) => (
    <div className="flex gap-6">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
            {number}
        </div>
        <div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    </div>
);

export default HomePage;
