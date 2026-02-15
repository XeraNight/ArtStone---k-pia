import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Maximize2 } from 'lucide-react';
import type { Document, DocumentCategory } from '@/types/database';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DocumentDetailDialogProps {
    document: Document | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDownload?: (doc: Document) => void;
}

const categoryLabels: Record<DocumentCategory, string> = {
    pricelist: 'Cenníky',
    manual: 'Návody',
    internal: 'Interné postupy',
    marketing: 'Marketing',
    legal: 'Právne',
};

export function DocumentDetailDialog({
    document,
    open,
    onOpenChange,
    onDownload,
}: DocumentDetailDialogProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const fileType = document?.file_type?.split('/').pop() || 'file';
    const isPDF = fileType === 'pdf' || document?.file_type === 'application/pdf';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'].includes(fileType.toLowerCase()) ||
        document?.file_type?.startsWith('image/');
    const canPreview = isPDF || isImage;

    const handleDownload = () => {
        if (onDownload && document) {
            onDownload(document);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    if (!document) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "max-h-[90vh] overflow-y-auto",
                isFullscreen ? "max-w-[95vw] w-[95vw]" : "max-w-[850px] w-full"
            )}>
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <DialogTitle className="text-2xl">{document.title}</DialogTitle>
                            <DialogDescription className="mt-2">
                                {document.description || 'Žiadny popis'}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            {canPreview && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleFullscreen}
                                >
                                    <Maximize2 className="h-4 w-4 mr-2" />
                                    {isFullscreen ? 'Zmenšiť' : 'Zväčšiť'}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Stiahnuť
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4 overflow-y-auto">
                    {/* Document metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Kategória</p>
                            <Badge variant="secondary">
                                {categoryLabels[document.category]}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Typ súboru</p>
                            <p className="font-medium">{fileType.toUpperCase()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Veľkosť</p>
                            <p className="font-medium">{document.file_size || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Nahral</p>
                            <p className="font-medium">
                                {document.created_by_user?.full_name || 'Neznámy'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Vytvorené</p>
                        <p className="font-medium">
                            {new Date(document.created_at).toLocaleString('sk-SK', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                            })}
                        </p>
                    </div>

                    {/* Preview Section */}
                    {canPreview && (
                        <div className="border rounded-lg overflow-hidden bg-muted/30">
                            <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                                <p className="text-sm font-medium">Náhľad</p>
                            </div>
                            <div
                                className="bg-white dark:bg-gray-900 overflow-auto"
                                style={{
                                    height: isFullscreen ? 'calc(90vh - 300px)' : '500px',
                                    width: '100%'
                                }}
                            >
                                {isPDF && (
                                    <iframe
                                        src={document.file_url}
                                        className="w-full h-full border-0"
                                        title={document.title}
                                    />
                                )}
                                {isImage && (
                                    <img
                                        src={document.file_url}
                                        alt={document.title}
                                        className="w-full h-auto"
                                        style={{ display: 'block' }}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {!canPreview && (
                        <div className="border rounded-lg p-8 text-center bg-muted/30">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Náhľad nie je k dispozícii pre tento typ súboru.
                                <br />
                                Stiahnite dokument pre zobrazenie.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
