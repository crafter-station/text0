"use client";
import { deleteDocument, getDocumentContentForExport } from "@/actions/docs";
import { downloadFile } from "@/lib/download";
import { usePathname, useRouter } from "next/navigation";
import {
	type ReactNode,
	createContext,
	useContext,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";

interface DocumentContextType {
	isDeleting: boolean;
	isExporting: boolean;
	pendingDocId: string | null;
	handleExport: (docId: string, docName: string) => Promise<void>;
	documentName: string | null;
	openDeleteDialog: (docName: string) => void;
	closeDeleteDialog: () => void;
	showDeleteDialog: boolean;
}

const DocumentContext = createContext<DocumentContextType | undefined>(
	undefined,
);

export function DocumentContextProvider({ children }: { children: ReactNode }) {
	const [isDeleting, startDeleteTransition] = useTransition();
	const [isExporting, startExportTransition] = useTransition();
	const [pendingDocId, setPendingDocId] = useState<string | null>(null);
	const [documentName, setDocumentName] = useState<string | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
	const pathname = usePathname();
	const router = useRouter();

	const handleDelete = async (docId: string, docName: string) => {
		closeDeleteDialog();
		setPendingDocId(docId);
		startDeleteTransition(async () => {
			try {
				const result = await deleteDocument(docId);
				if (result.success) {
					toast.success(`Document "${docName}" deleted successfully`);
					if (pathname === `/docs/${docId}`) {
						console.log("reached");
						router.push("/home");
					}
					router.refresh();
				} else {
					toast.error(result.error || "Failed to delete document.");
				}
			} catch (error) {
				console.error("Delete error:", error);
				toast.error("An unexpected error occurred during deletion.");
				console.log("reached error");
			} finally {
				setPendingDocId(null);
			}
		});
	};

	const handleExport = async (docId: string, docName: string) => {
		setPendingDocId(docId);
		startExportTransition(async () => {
			try {
				const result = await getDocumentContentForExport(docId);
				if (result.success && result.data) {
					downloadFile(`${docName}.md`, result.data.content, "text/markdown");
					toast.success(`Exported "${docName}.md"`);
				} else {
					toast.error(result.error || "Failed to export document content.");
				}
			} catch (error) {
				console.error("Export error:", error);
				toast.error("An unexpected error occurred during export.");
			} finally {
				setPendingDocId(null);
			}
		});
	};

	function openDeleteDialog(docName: string) {
		setDocumentName(docName);
		setShowDeleteDialog(true);
		console.log("Dialog opened.");
	}

	function closeDeleteDialog() {
		setDocumentName(null);
		setShowDeleteDialog(false);
	}

	const value = {
		isDeleting,
		isExporting,
		pendingDocId,
		handleExport,
		documentName,
		openDeleteDialog,
		closeDeleteDialog,
		showDeleteDialog,
	};

	return (
		<DocumentContext.Provider value={value}>
			{children}
		</DocumentContext.Provider>
	);
}

export default function useDocumentContext() {
	const context = useContext(DocumentContext);
	if (context === undefined) {
		throw Error("useDocumentContext must be within a DocumentContextProvider");
	}
	return context;
}
