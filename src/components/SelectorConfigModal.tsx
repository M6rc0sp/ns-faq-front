import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

interface SelectorConfig {
    selector: string;
    position: 'before' | 'after' | 'first-child' | 'last-child';
}

interface SelectorConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
}

const TEMPLATES = [
    { id: 'homepage', label: 'Homepage', description: 'Página inicial da loja' },
    { id: 'category', label: 'Categoria', description: 'Páginas de categorias' },
    { id: 'product', label: 'Produto', description: 'Páginas de produtos' },
];

const POSITION_OPTIONS = [
    { value: 'before', label: 'Antes' },
    { value: 'after', label: 'Depois' },
    { value: 'first-child', label: 'Primeiro filho' },
    { value: 'last-child', label: 'Último filho' },
];

export const SelectorConfigModal: React.FC<SelectorConfigModalProps> = ({ isOpen, onClose, storeId }) => {
    const [activeTab, setActiveTab] = useState<string>('homepage');
    const [configs, setConfigs] = useState<Record<string, SelectorConfig>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Carregar configurações
    useEffect(() => {
        if (isOpen && storeId) {
            loadConfigs();
        }
    }, [isOpen, storeId]);

    const loadConfigs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const results: Record<string, SelectorConfig> = {};
            for (const template of TEMPLATES) {
                try {
                    const response = await faqAPI.getSelectorConfig(storeId, template.id);
                    results[template.id] = response.data || { selector: '', position: 'last-child' };
                } catch (err) {
                    // Use defaults if not found
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
            await faqAPI.updateSelectorConfig(storeId, activeTab, config);
            setSuccess(`Configuração de ${activeTab} salva com sucesso!`);
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
    const currentTemplate = TEMPLATES.find(t => t.id === activeTab);

    return (
        <Box
            position="fixed"
            top="0"
            left="0"
            width="100%"
            height="100%"
            backgroundColor="rgba(0, 0, 0, 0.5)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex="9999"
            onClick={onClose}
        >
            <Card
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '90%',
                    maxWidth: '600px',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    borderRadius: '12px',
                }}
            >
                <Card.Header>
                    <Box display="flex" justifyContent="space-between" alignItems="center" padding="4">
                        <Title as="h2">⚙️ Configurar Seletores CSS</Title>
                        <Button
                            appearance="minimal"
                            onClick={onClose}
                            style={{ padding: '0', minWidth: 'auto' }}
                        >
                            <CloseIcon size="large" />
                        </Button>
                    </Box>
                </Card.Header>

                <Card.Body>
                    <Box padding="4" display="flex" flexDirection="column" gap="4">
                        {/* Tabs */}
                        <Box display="flex" gap="2" borderBottom="1px solid" borderColor="neutral-interactive">
                            {TEMPLATES.map(template => (
                                <Button
                                    key={template.id}
                                    appearance={activeTab === template.id ? 'primary' : 'secondary'}
                                    onClick={() => setActiveTab(template.id)}
                                    style={{
                                        borderBottom: activeTab === template.id ? '3px solid' : 'none',
                                        borderRadius: '0',
                                        paddingBottom: '12px',
                                    }}
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
                                {/* Template Info */}
                                {currentTemplate && (
                                    <Box
                                        padding="3"
                                        backgroundColor="neutral-background"
                                        borderRadius="2"
                                        borderLeft="4px solid"
                                        borderColor="neutral-interactive"
                                    >
                                        <Label htmlFor="template-info" as="div">{currentTemplate.label}</Label>
                                        <Text as="p" color="neutral-textLow" fontSize="smaller">
                                            {currentTemplate.description}
                                        </Text>
                                    </Box>
                                )}

                                {/* Error */}
                                {error && <Alert appearance="danger" title="Erro">{error}</Alert>}

                                {/* Success */}
                                {success && <Alert appearance="success" title="Sucesso">{success}</Alert>}

                                {/* CSS Selector Field */}
                                <Box display="flex" flexDirection="column" gap="2">
                                    <Label htmlFor="selector-input">Seletor CSS</Label>
                                    <Textarea
                                        id="selector-input"
                                        placeholder="Ex: .meu-container, #faq-section, [data-store='home']"
                                        value={currentConfig.selector}
                                        onChange={(e) => updateConfig('selector', e.target.value)}
                                        rows={3}
                                    />
                                    <Text as="p" fontSize="smaller" color="neutral-textLow">
                                        💡 Dica: Use o inspetor de elementos do navegador (F12) para encontrar o seletor correto.
                                    </Text>
                                </Box>

                                {/* Position Select */}
                                <Box display="flex" flexDirection="column" gap="2">
                                    <Label htmlFor="position-select">Posição do FAQ</Label>
                                    <Select
                                        id="position-select"
                                        value={currentConfig.position}
                                        onChange={(e) => updateConfig('position', e.target.value as any)}
                                    >
                                        {POSITION_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </Select>
                                    <Box display="flex" flexDirection="column" gap="1" fontSize="smaller" color="neutral-textLow">
                                        <Text>
                                            • <strong>Antes</strong>: FAQ aparece antes do elemento selecionado
                                        </Text>
                                        <Text>
                                            • <strong>Depois</strong>: FAQ aparece depois do elemento selecionado
                                        </Text>
                                        <Text>
                                            • <strong>Primeiro filho</strong>: FAQ é o primeiro elemento dentro do container
                                        </Text>
                                        <Text>
                                            • <strong>Último filho</strong>: FAQ é o último elemento dentro do container (padrão)
                                        </Text>
                                    </Box>
                                </Box>

                                {/* Action Buttons */}
                                <Box display="flex" gap="2" marginTop="4">
                                    <Button
                                        appearance="secondary"
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
                                        {isSaving ? <Spinner /> : '💾 Salvar Configuração'}
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </Card.Body>
            </Card>
        </Box>
    );
};
