import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Card, Text, Title } from '@nimbus-ds/components';
import { TrashIcon } from '@nimbus-ds/icons';
import type { Faq } from '@/types/faq';

interface FaqListProps {
    faqs: Faq[];
    onDelete: (id: number) => void;
}

const FaqList: React.FC<FaqListProps> = ({ faqs, onDelete }) => {
    const { t } = useTranslation();

    if (faqs.length === 0) {
        return (
            <Card>
                <Card.Body>
                    <Box display="flex" flexDirection="column" alignItems="center" gap="4" textAlign="center">
                        <Title as="h2">{t('faq.noItems')}</Title>
                    </Box>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Box display="flex" flexDirection="column" gap="2">
            {faqs.map((faq) => (
                <Card key={faq.id}>
                    <Card.Body>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Title as="h2">{faq.title}</Title>
                                <Text as="p" color="neutral-textDisabled" fontSize="caption">
                                    {faq.questions?.length || 0} {t('faq.questions', 'perguntas')} · {(faq.product_bindings?.length || 0) + (faq.category_bindings?.length || 0)} {t('faq.bindings', 'vínculos')}
                                </Text>
                            </Box>
                            <Button appearance="danger" onClick={() => onDelete(faq.id)}>
                                <TrashIcon />
                                {t('faq.delete')}
                            </Button>
                        </Box>
                    </Card.Body>
                </Card>
            ))}
        </Box>
    );
};

export default FaqList;
