import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Text,
    Title,
    Textarea,
    Select,
    Card,
    Spinner,
    Alert,
    Label,
} from '@nimbus-ds/components';
import { CloseIcon } from '@nimbus-ds/icons';
import { faqAPI } from '@/app/api';
import styles from './SelectorConfigModal.module.css';

interface SelectorConfig {
    selector: string;
    position: 'before' | 'after' | 'first-child' | 'last-child';
}

interface SelectorConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TEMPLATES = [
    { id: 'homepage', label: 'Homepage' },
    { id: 'category', label: 'Categoria' },
    { id: 'product', label: 'Produto' },
];

const POSITION_OPTIONS = [
    { value: 'before', label: 'Antes' },
    { value: 'after', label: 'Depois' },
    { value: 'first-child', label: 'Primeiro filho' },
    { value: 'last-child', label: 'Último filho' },
];

export const SelectorConfigModal: React.FC<SelectorConfigModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<string>('homepage');
    const [configs, setConfigs] = useState<Record<string, SelectorConfig>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadConfigs();
        }
    }, [isOpen]);

    const loadConfigs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const results: Record<string, SelectorConfig> = {};
            for (const template of TEMPLATES) {
                try {
                    const response = await faqAPI.getSelectorConfig(template.id);
                    results[template.id] = response.data.data || { selector: '', position: 'last-child' };
                } catch (err) {
                    results[template.id] = { selector: '', position: 'last-child' };
                }
            }
            setConfigs(results);
        } catch (err) {
            const message = (err as Error)?.message || 'Erro ao carregar configurações';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const config = configs[activeTab];
            await faqAPI.updateSelectorConfig(activeTab, config);
            setSuccess('Configuração salva com sucesso!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            const message = (err as Error)?.message || 'Erro ao salvar configuração';
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const updateConfig = (field: keyof SelectorConfig, value: string) => {
        setConfigs(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                [field]: value,
            },
        }));
    };

    if (!isOpen) return null;

    const currentConfig = configs[activeTab] || { selector: '', position: 'last-child' };

    return (
        <Box
            className={styles.modalOverlay}
            onClick={onClose}
        >
            <Card
                onClick={(e) => e.stopPropagation()}
                className={styles.modalCard}
            >
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" padding="4">
                    <Title>⚙️ Configurar Seletores</Title>
                    <Button
                        appearance="transparent"
                        onClick={onClose}
                        style={{ padding: '0', minWidth: 'auto' }}
                    >
                        <CloseIcon />
                    </Button>
                </Box>

                {/* Separator */}
                <Box
                    style={{
                        height: '1px',
                        backgroundColor: '#e0e0e0',
                        margin: '0 16px',
                    }}
                />

                {/* Content */}
                <Box padding="4" display="flex" flexDirection="column" gap="4">
                    {/* Tabs */}
                    <Box display="flex" gap="2">
                        {TEMPLATES.map(template => (
                            <Button
                                key={template.id}
                                appearance={activeTab === template.id ? 'primary' : 'neutral'}
                                onClick={() => setActiveTab(template.id)}
                            >
                                {template.label}
                            </Button>
                        ))}
                    </Box>

                    {/* Loading */}
                    {isLoading && (
                        <Box display="flex" justifyContent="center" padding="6">
                            <Spinner />
                        </Box>
                    )}

                    {!isLoading && (
                        <>
                            {/* Error */}
                            {error && <Alert appearance="danger" title="Erro">{error}</Alert>}

                            {/* Success */}
                            {success && <Alert appearance="success" title="Sucesso">{success}</Alert>}

                            {/* CSS Selector Field */}
                            <Box display="flex" flexDirection="column" gap="2">
                                <Label htmlFor="selector-input">Seletor CSS</Label>
                                <Textarea
                                    id="selector-input"
                                    name="selector"
                                    placeholder="Ex: .meu-container, #faq-section"
                                    value={currentConfig.selector}
                                    onChange={(e) => updateConfig('selector', e.target.value)}
                                    rows={3}
                                />
                                <Text>
                                    💡 Use F12 para encontrar o seletor correto
                                </Text>
                            </Box>

                            {/* Position Select */}
                            <Box display="flex" flexDirection="column" gap="2">
                                <Label htmlFor="position-select">Posição</Label>
                                <Select
                                    id="position-select"
                                    name="position"
                                    value={currentConfig.position}
                                    onChange={(e) => updateConfig('position', e.target.value as any)}
                                >
                                    {POSITION_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </Select>
                            </Box>

                            {/* Position Help */}
                            <Box display="flex" flexDirection="column" gap="2">
                                <Text fontWeight="bold">Opções disponíveis:</Text>
                                <Text>• Antes: insere antes do elemento</Text>
                                <Text>• Depois: insere depois do elemento</Text>
                                <Text>• Primeiro filho: primeiro da caixa</Text>
                                <Text>• Último filho: último da caixa (padrão)</Text>
                            </Box>

                            {/* Action Buttons */}
                            <Box display="flex" gap="2" marginTop="4">
                                <Button
                                    appearance="neutral"
                                    onClick={onClose}
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    appearance="primary"
                                    onClick={handleSave}
                                    disabled={isSaving || !currentConfig.selector}
                                >
                                    {isSaving ? <Spinner /> : '💾 Salvar'}
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Card>
        </Box>
    );
};
