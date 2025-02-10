import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import toast from 'react-hot-toast';

export const AssinaturaSucesso = () => {
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();
  const location = useLocation();
  const { status, checkSubscription } = useSubscription(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const maxAttempts = 10;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let verificationTimer: NodeJS.Timeout;

    const verifySubscription = async () => {
      try {
        await checkSubscription();
        if (status === 'active') {
          // Assinatura confirmada, iniciar contagem regressiva
          timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                const destination = location.state?.from?.pathname || '/dashboard';
                navigate(destination, { replace: true });
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else if (verificationAttempts < maxAttempts) {
          // Tentar novamente em 2 segundos
          setVerificationAttempts(prev => prev + 1);
          verificationTimer = setTimeout(verifySubscription, 2000);
        } else {
          // Máximo de tentativas atingido
          toast.error('Não foi possível confirmar sua assinatura. Por favor, entre em contato com o suporte.');
          navigate('/pricing', { replace: true });
        }
      } catch (error) {
        if (verificationAttempts < maxAttempts) {
          // Tentar novamente em 2 segundos
          setVerificationAttempts(prev => prev + 1);
          verificationTimer = setTimeout(verifySubscription, 2000);
        } else {
          toast.error('Erro ao verificar assinatura. Por favor, entre em contato com o suporte.');
          navigate('/pricing', { replace: true });
        }
      }
    };

    verifySubscription();

    return () => {
      if (timer) clearInterval(timer);
      if (verificationTimer) clearTimeout(verificationTimer);
    };
  }, [navigate, checkSubscription, verificationAttempts, status, location]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Pagamento realizado com sucesso!
        </h2>
        <p className="text-gray-600 mb-4">
          {verificationAttempts < maxAttempts ? (
            status === 'active' ? (
              `Você será redirecionado para o dashboard em ${countdown} segundos...`
            ) : (
              'Verificando status da sua assinatura...'
            )
          ) : (
            'Não foi possível verificar sua assinatura. Por favor, tente novamente mais tarde.'
          )}
        </p>
        {status === 'active' && (
          <button
            onClick={() => {
              const destination = location.state?.from?.pathname || '/dashboard';
              navigate(destination, { replace: true });
            }}
            className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 transition-colors"
          >
            Ir para o Dashboard agora
          </button>
        )}
      </div>
    </div>
  );
};
