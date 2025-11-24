import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/layout/PageTransition';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';

export function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/login');
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  return (
    <PageTransition>
      <AuthLayout>
        <RegisterForm
          onSuccess={handleSuccess}
          onNavigateToLogin={handleNavigateToLogin}
        />
      </AuthLayout>
    </PageTransition>
  );
}
