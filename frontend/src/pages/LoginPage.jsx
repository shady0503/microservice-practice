import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/layout/PageTransition';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  return (
    <PageTransition>
      <AuthLayout>
        <LoginForm
          onSuccess={handleSuccess}
          onNavigateToRegister={handleNavigateToRegister}
        />
      </AuthLayout>
    </PageTransition>
  );
}

export default LoginPage;
