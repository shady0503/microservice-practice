import LoginForm from './LoginForm'
import AuthLayout from './AuthLayout'

const LoginPage = ({ onBack, onNavigateToRegister }) => {
  return (
    <AuthLayout
      title={<span>Bon <span className="font-bold">retour</span></span>}
      subtitle="Connectez-vous pour accéder à votre espace personnel et gérer vos déplacements urbains"
      onBack={onBack}
    >
      <LoginForm onSwitchToRegister={onNavigateToRegister} />
    </AuthLayout>
  )
}

export default LoginPage