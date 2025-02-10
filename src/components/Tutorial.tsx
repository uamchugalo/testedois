import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface TutorialProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  forceShow?: boolean;
  onClose?: () => void;
}

export function Tutorial({ currentTab, setCurrentTab, forceShow, onClose }: TutorialProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);

  // Define os passos baseado na aba atual
  useEffect(() => {
    const newSteps: Step[] = [];
    
    // Empresa
    if (currentTab === 'company') {
      newSteps.push(
        {
          target: '[data-tour="company-name"]',
          content: 'Comece preenchendo o nome da sua empresa aqui.',
          placement: 'bottom',
          disableBeacon: true,
        },
        {
          target: '[data-tour="company-cnpj"]',
          content: 'Digite o CNPJ da empresa.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="company-phone"]',
          content: 'Adicione um telefone para contato.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="company-email"]',
          content: 'Informe o e-mail da empresa.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="company-logo"]',
          content: 'Faça upload da logo da sua empresa. Ela aparecerá nos orçamentos e ordens de serviço.',
          placement: 'bottom',
        }
      );
    }

    // Financeiro
    if (currentTab === 'accounting') {
      newSteps.push(
        {
          target: '[data-tour="monthly-revenue"]',
          content: 'Aqui você pode ver a receita total do mês.',
          placement: 'bottom',
          disableBeacon: true,
        },
        {
          target: '[data-tour="monthly-costs"]',
          content: 'Veja os custos totais com materiais.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="monthly-profit"]',
          content: 'Este é o seu lucro (receita - custos).',
          placement: 'bottom',
        }
      );
    }

    // Materiais e Serviços
    if (currentTab === 'materials') {
      newSteps.push(
        {
          target: '[data-tour="add-service"]',
          content: 'Adicione os serviços que você oferece e seus preços.',
          placement: 'bottom',
          disableBeacon: true,
        },
        {
          target: '[data-tour="add-material"]',
          content: 'Cadastre os materiais que você utiliza nos serviços.',
          placement: 'bottom',
        }
      );
    }

    // Lista de OS
    if (currentTab === 'orders') {
      newSteps.push(
        {
          target: '[data-tour="customer-info"]',
          content: 'Preencha todos os dados do cliente aqui.',
          placement: 'bottom',
          disableBeacon: true,
        },
        {
          target: '[data-tour="generate-os"]',
          content: 'Aqui você pode gerar uma nova ordem de serviço em PDF.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="upload-signed"]',
          content: 'Depois que o cliente assinar, você pode fazer upload da OS assinada.',
          placement: 'bottom',
        }
      );
    }

    setSteps(newSteps);
  }, [currentTab]);

  // Inicia o tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial || forceShow) {
      setCurrentTab('company');
      setRun(true);
      setStepIndex(0);
    }
  }, [setCurrentTab, forceShow]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;

    // Se o usuário clicou em próximo ou anterior
    if (type === 'step:after' && (action === 'next' || action === 'prev')) {
      // Se estamos na última etapa da aba atual
      if (currentTab === 'company' && index === 4) {
        setCurrentTab('accounting');
        setStepIndex(0);
        return;
      }
      if (currentTab === 'accounting' && index === 2) {
        setCurrentTab('materials');
        setStepIndex(0);
        return;
      }
      if (currentTab === 'materials' && index === 1) {
        setCurrentTab('orders');
        setStepIndex(0);
        return;
      }
      
      // Se não for mudança de aba, atualiza o índice normalmente
      setStepIndex(index + (action === 'next' ? 1 : -1));
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem('hasSeenTutorial', 'true');
      setRun(false);
      setStepIndex(0);
      onClose?.();
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      hideBackButton={false}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      disableScrolling={false}
      styles={{
        options: {
          primaryColor: '#3b82f6',
          zIndex: 1000,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
        },
        buttonBack: {
          color: '#3b82f6',
        },
      }}
      locale={{
        back: 'Anterior',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular tutorial',
      }}
    />
  );
}
