import RegisterForm from './RegisterForm'
import AuthLayout from './AuthLayout'

const RegisterPage = ({ onBack, onNavigateToLogin }) => {
  return (
    <AuthLayout
      title={<span>Rejoignez <span className="font-bold">UrbanMove</span></span>}
      subtitle="Créez votre compte en quelques instants et simplifiez vos déplacements quotidiens"
      onBack={onBack}
    >
      <RegisterForm onSwitchToLogin={onNavigateToLogin} />
    </AuthLayout>
  )
}

export default RegisterPage