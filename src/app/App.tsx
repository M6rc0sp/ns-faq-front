import React, { useEffect, useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Box, Text, ToastProvider } from '@nimbus-ds/components';
import { ErrorBoundary, connect, iAmReady } from '@tiendanube/nexo';
import Router from '@/app/Router';

import nexo from './NexoClient';
import NexoSyncRoute from './NexoSyncRoute';
import { DarkModeProvider } from './DarkModeProvider';
import './i18n';

const AppContentInner: React.FC = () => {
    const [isConnect, setIsConnect] = useState(false);
    const location = useLocation();

    const isInstallRoute = location.pathname === '/ns/install';

    useEffect(() => {
        if (isInstallRoute) {
            setIsConnect(true);
            return;
        }

        if (!isConnect) {
            connect(nexo)
                .then(async () => {
                    setIsConnect(true);
                    iAmReady(nexo);
                })
                .catch(() => {
                    setIsConnect(false);
                });
        }
    }, [isConnect, isInstallRoute]);

    if (!isConnect)
        return (
            <Box
                height="100vh"
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                <Text>Conectando...</Text>
            </Box>
        );

    if (isInstallRoute) {
        return <Router />;
    }

    return (
        <ErrorBoundary nexo={nexo}>
            <NexoSyncRoute>
                <Router />
            </NexoSyncRoute>
        </ErrorBoundary>
    );
};

const App: React.FC = () => {
    return (
        <DarkModeProvider>
            <ToastProvider>
                <BrowserRouter>
                    <AppContentInner />
                </BrowserRouter>
            </ToastProvider>
        </DarkModeProvider>
    );
};

export default App;
