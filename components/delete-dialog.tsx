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

export function DeleteDialog() {
	const { documentName, closeDeleteDialog, showDeleteDialog } =
		useDocumentContext();

	return (
		<AlertDialog open={showDeleteDialog}>
			<AlertDialogContent>
				<AlertDialogTitle>
					Are you sure you want to delete "{documentName}"?
				</AlertDialogTitle>
				<AlertDialogDescription>
					This will permanently delete your document. This action cannot be
					undone.
				</AlertDialogDescription>
				<div className="flex justify-end gap-4">
					<AlertDialogCancel asChild onClick={(e) => e.stopPropagation()}>
						<button type="button">Cancel</button>
					</AlertDialogCancel>
					<AlertDialogAction asChild onClick={() => closeDeleteDialog()}>
						<button type="button">Delete Document</button>
					</AlertDialogAction>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}
