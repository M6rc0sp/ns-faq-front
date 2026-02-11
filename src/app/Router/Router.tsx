import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminPage, InstallPage } from '@/pages';

const Router: React.FC = () => (
    <Routes>
        <Route path="/" element={<AdminPage />} />
        <Route path="/ns/install" element={<InstallPage />} />
        <Route path="/ns/faq" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

export default Router;
