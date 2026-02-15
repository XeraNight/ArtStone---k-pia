import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';
import { DocumentDetailDialog } from '@/components/documents/DocumentDetailDialog';
import { DocumentAccessDialog } from '@/components/documents/DocumentAccessDialog';
import { DeleteDocumentDialog } from '@/components/documents/DeleteDocumentDialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Search,
  FileText,
  Download,
  MoreHorizontal,
  Eye,
  Trash2,
  FolderOpen,
  File,
  FileSpreadsheet,
  FileImage,
  Film,
  FileCode,
  Shield,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useDocuments, useDeleteDocument } from '@/hooks/useDocuments';
import { toast } from 'sonner';
import type { DocumentCategory, Document } from '@/types/database';

const categoryLabels: Record<DocumentCategory, string> = {
  pricelist: 'Cenníky',
  manual: 'Návody',
  internal: 'Interné postupy',
  marketing: 'Marketing',
  legal: 'Právne',
};

const categoryColors: Record<DocumentCategory, string> = {
  pricelist: 'bg-primary/15 text-primary',
  manual: 'bg-info/15 text-info',
  internal: 'bg-warning/15 text-warning',
  marketing: 'bg-success/15 text-success',
  legal: 'bg-status-contacted/15 text-status-contacted',
};

const fileIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  docx: File,
  doc: File,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  txt: FileCode,
  mp4: Film,
};

export default function Documents() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: documents, isLoading } = useDocuments({
    category: categoryFilter !== 'all' ? (categoryFilter as DocumentCategory) : undefined,
    search: searchQuery || undefined,
  });
  const deleteDocument = useDeleteDocument();

  const isAdmin = user?.role === 'admin';

  // Group by category
  const groupedDocuments = documents?.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<DocumentCategory, Document[]>) || {};

  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument.mutateAsync(documentToDelete.id);
      toast.success('Dokument vymazaný');
      setDocumentToDelete(null);
    } catch (error) {
      toast.error('Nepodarilo sa vymazať dokument');
    }
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setDetailDialogOpen(true);
  };

  const handleAccess = (doc: Document) => {
    setSelectedDocument(doc);
    setAccessDialogOpen(true);
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.file_url) {
      toast.error('URL súboru nie je k dispozícii');
      return;
    }

    try {
      // Fetch the file and create a downloadable blob
      const response = await fetch(doc.file_url);
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary link and click it to download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.title + '.' + (doc.file_type?.split('/').pop() || 'file');
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success('Sťahovanie spustené');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Nepodarilo sa stiahnuť súbor');
    }
  };

  return (
    <AppLayout title="Dokumenty">
      <div className="space-y-6 animate-fade-in">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Hľadať dokumenty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Kategória" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky kategórie</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(isAdmin || user?.role === 'manager') && (
            <>
              {/* Mobile: Icon-only button */}
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="md:hidden min-h-[44px] min-w-[44px]"
                size="icon"
                title="Nahrať dokument"
              >
                <Plus className="h-4 w-4" />
              </Button>
              {/* Desktop: Full button */}
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="hidden md:flex"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nahrať dokument
              </Button>
            </>
          )}
        </div>

        {/* Documents loading */}
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Card key={j} className="shadow-soft">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Skeleton className="w-12 h-12 rounded-xl" />
                          <div className="flex-1">
                            <Skeleton className="h-5 w-full mb-2" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Documents grid */}
            {Object.entries(groupedDocuments).map(([category, docs]) => (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-display text-lg font-semibold">
                    {categoryLabels[category as DocumentCategory]}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {(docs as Document[]).length}
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {(docs as Document[]).map((doc) => {
                    const fileType = doc.file_type?.split('/').pop() || 'file';
                    const FileIcon = fileIcons[fileType] || File;
                    return (
                      <Card
                        key={doc.id}
                        className="shadow-soft hover:shadow-md transition-all duration-200 cursor-pointer group"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                'p-3 rounded-xl',
                                categoryColors[doc.category]
                              )}
                            >
                              <FileIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-medium text-foreground truncate">
                                    {doc.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {fileType.toUpperCase()} • {doc.file_size || '-'}
                                  </p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleView(doc)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Zobraziť
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Stiahnuť
                                    </DropdownMenuItem>
                                    {(isAdmin || user?.role === 'manager') && (
                                      <DropdownMenuItem onClick={() => handleAccess(doc)}>
                                        <Shield className="h-4 w-4 mr-2" />
                                        Upraviť prístup
                                      </DropdownMenuItem>
                                    )}
                                    {(isAdmin || user?.role === 'manager') && (
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => handleDeleteClick(doc)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Vymazať
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                <span className="text-xs text-muted-foreground">
                                  {doc.created_by_user?.full_name || 'Neznámy'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(doc.created_at).toLocaleDateString('sk-SK')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}

            {documents?.length === 0 && (
              <EmptyState
                icon={<FolderOpen className="h-full w-full" />}
                title="Zatiaľ žiadne dokumenty"
                description="Nahrajte dokumenty, zmluvy alebo prílohy pre lepšiu organizáciu."
                action={{
                  label: "Nahrať dokument",
                  onClick: () => fileInputRef.current?.click(),
                  icon: <Upload className="h-4 w-4" />,
                }}
              />
            )}
          </>
        )}
      </div>

      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />

      <DocumentDetailDialog
        document={selectedDocument}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onDownload={handleDownload}
      />

      <DocumentAccessDialog
        document={selectedDocument}
        open={accessDialogOpen}
        onOpenChange={setAccessDialogOpen}
      />

      <DeleteDocumentDialog
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        documentTitle={documentToDelete?.title || ''}
      />
    </AppLayout >
  );
}
