import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadDocument, useCreateDocument } from '@/hooks/useDocuments';
import type { DocumentCategory } from '@/types/database';

interface UploadDocumentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const categoryLabels: Record<DocumentCategory, string> = {
    pricelist: 'Cenníky',
    manual: 'Návody',
    internal: 'Interné postupy',
    marketing: 'Marketing',
    legal: 'Právne',
};

const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'text/plain',
    'video/mp4',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
];

const FILE_TYPE_EXTENSIONS = '.pdf,.png,.jpg,.jpeg,.txt,.mp4,.doc,.docx,.csv';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function UploadDocumentDialog({ open, onOpenChange }: UploadDocumentDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<DocumentCategory>('marketing');
    const [isDragging, setIsDragging] = useState(false);

    const uploadDocument = useUploadDocument();
    const createDocument = useCreateDocument();

    const isUploading = uploadDocument.isPending || createDocument.isPending;

    const handleFileSelect = (file: File) => {
        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            toast.error('Nepodporovaný typ súboru. Povolené typy: PDF, PNG, JPG, TXT, MP4, DOC, DOCX, CSV');
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            toast.error('Súbor je príliš veľký. Maximálna veľkosť je 50MB');
            return;
        }

        setSelectedFile(file);
        if (!title) {
            // Auto-fill title from filename
            setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !title) {
            toast.error('Prosím vyplňte všetky polia');
            return;
        }

        try {
            // Upload file to storage
            const uploadResult = await uploadDocument.mutateAsync(selectedFile);

            // Create document record in database
            await createDocument.mutateAsync({
                title,
                category,
                file_url: uploadResult.url,
                file_type: selectedFile.type,
                file_size: uploadResult.fileSize,
            });

            toast.success('Dokument úspešne nahraný');
            handleClose();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error?.message || 'Nepodarilo sa nahrať dokument');
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setTitle('');
        setCategory('marketing');
        onOpenChange(false);
    };

    const removeFile = () => {
        setSelectedFile(null);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nahrať dokument</DialogTitle>
                    <DialogDescription>
                        Nahrajte PDF, obrázky, text, video, Word dokumenty alebo CSV súbory
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* File Upload Area */}
                    {!selectedFile ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                relative border-2 border-dashed rounded-lg p-8
                ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
                transition-colors cursor-pointer hover:border-primary/50
              `}
                        >
                            <input
                                type="file"
                                onChange={handleFileInputChange}
                                accept={FILE_TYPE_EXTENSIONS}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-2 text-center">
                                <Upload className="h-10 w-10 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Kliknite alebo pretiahnite súbor
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        PDF, PNG, JPG, TXT, MP4, DOC, DOCX, CSV (max 50MB)
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <FileText className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="font-medium text-sm">{selectedFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={removeFile}
                                    disabled={isUploading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Názov dokumentu *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Zadajte názov dokumentu"
                            disabled={isUploading}
                        />
                    </div>

                    {/* Category Select */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Kategória *</Label>
                        <Select
                            value={category}
                            onValueChange={(value) => setCategory(value as DocumentCategory)}
                            disabled={isUploading}
                        >
                            <SelectTrigger id="category">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(categoryLabels).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                        Zrušiť
                    </Button>
                    <Button onClick={handleUpload} disabled={!selectedFile || !title || isUploading}>
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Nahrávam...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Nahrať
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
