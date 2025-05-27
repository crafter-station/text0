"use client";
import useDocumentContext from "@/app/context/documentContext";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
} from "./ui/alert-dialog";

import { Loader2 } from "lucide-react";

export function DeleteDialog() {
	const { documentName, closeDeleteDialog, showDeleteDialog, handleDelete } = useDocumentContext();
	

	return (
		<AlertDialog open={showDeleteDialog} >
			<AlertDialogContent >
				<AlertDialogTitle>
					Are you sure you want to delete "{documentName}"?
				</AlertDialogTitle>
				<AlertDialogDescription>
					This will permanently delete your document. This action cannot be
					undone.
				</AlertDialogDescription>
				<div className="flex justify-end gap-4">
					<AlertDialogCancel asChild onClick={() => closeDeleteDialog()}>
						<button type="button">
							Cancel
						</button>
					</AlertDialogCancel>
					<AlertDialogAction className="bg-red-900/80 hover:bg-red-900/100" asChild onClick={() => handleDelete()}>
						<button>
							Delete Document
						</button>
					</AlertDialogAction>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}
