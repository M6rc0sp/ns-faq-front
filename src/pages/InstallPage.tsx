import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Text, Spinner, Card, Button, Title } from '@nimbus-ds/components';
import axiosStandard from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const InstallPage: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState<string>('Processando instalação...');
    const location = useLocation();
    const navigate = useNavigate();
    const hasCalled = useRef(false);

    useEffect(() => {
        const handleInstall = async () => {
            if (hasCalled.current) return;
            hasCalled.current = true;

            try {
                const searchParams = new URLSearchParams(location.search);
                const code = searchParams.get('code');

                if (code) {
                    setStatus('loading');
                    setMessage('Conectando ao servidor de instalação...');

                    const response = await axiosStandard.get(`${API_URL}/api/ns/install?code=${code}`, {
                        withCredentials: true,
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.data && response.data.success) {
                        setStatus('success');
                        setMessage('Instalação concluída com sucesso! Redirecionando de volta pra loja...');

                        setTimeout(() => {
                            window.location.href = 'https://www.nuvemshop.com.br/login';
                        }, 3000);
                    } else {
                        setStatus('error');
                        setMessage(`Erro: ${response.data?.message || 'Falha na instalação'}`);
                    }
                } else {
                    setStatus('error');
                    setMessage('Erro: Código de instalação não encontrado');
                }
            } catch (error: any) {
                setStatus('error');
                setMessage(`Erro durante instalação: ${error.message || 'Falha na conexão'}`);
            }
        };

        handleInstall();
    }, [location, navigate]);

    return (
        <Box
            height="100vh"
            display="flex"
            justifyContent="center"
            alignItems="center"
            padding="4"
            backgroundColor="primary-surface"
        >
            <Box width="100%" style={{ maxWidth: '900px' }}>
                <Card padding="base">
                    <Box marginBottom="6" paddingBottom="4">
                        <Title as="h2">Instalação do Aplicativo</Title>
                    </Box>
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap="6"
                        paddingY="8"
                    >
                        {status === 'loading' && (
                            <Box display="flex" flexDirection="column" alignItems="center" gap="4">
                                <Spinner size="medium" />
                                <Text color="neutral-textLow">Isso deve levar apenas alguns instantes...</Text>
                            </Box>
                        )}

                        <Text
                            textAlign="center"
                            fontSize="highlight"
                            fontWeight={status === 'error' ? 'bold' : 'regular'}
                            color={
                                status === 'error'
                                    ? 'danger-textHigh'
                                    : status === 'success'
                                        ? 'success-textHigh'
                                        : 'neutral-textHigh'
                            }
                        >
                            {message}
                        </Text>
                    </Box>
                    {status === 'error' && (
                        <Box display="flex" gap="2" justifyContent="center" paddingTop="4">
                            <Button
                                appearance="primary"
                                onClick={() => (window.location.href = 'https://www.nuvemshop.com.br/login')}
                            >
                                Voltar para a Nuvemshop
                            </Button>
                        </Box>
                    )}
                </Card>
            </Box>
        </Box>
    );
};

export default InstallPage;
