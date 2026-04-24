// ============================================================================
// Admin Knowledge Base Shell
// ============================================================================
//
// List of KB documents with delete action. Add document form: title,
// source URL, and content textarea. On submit, POSTs to /api/admin/kb
// which inserts the document and generates an embedding.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Book, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { KBDocument } from "@/lib/features/admin";

import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Separator } from "@/components/primitives/separator";
import { Textarea } from "@/components/primitives/textarea";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Props = {
	documents: KBDocument[];
};

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminKBShell({ documents }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);

	// Form state
	const [title, setTitle] = useState("");
	const [sourceUrl, setSourceUrl] = useState("");
	const [content, setContent] = useState("");
	const [showForm, setShowForm] = useState(false);

	async function deleteDocument(docId: string) {
		setLoading(docId);
		try {
			const res = await fetch(`/api/admin/kb/${docId}`, { method: "DELETE" });
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Document deleted");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(null);
		}
	}

	async function createDocument() {
		if (!title.trim() || !content.trim()) {
			toast.error("Title and content are required");
			return;
		}
		setCreating(true);
		try {
			const res = await fetch("/api/admin/kb", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: title.trim(),
					sourceUrl: sourceUrl.trim() || null,
					content: content.trim(),
				}),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Document added with embedding");
			setTitle("");
			setSourceUrl("");
			setContent("");
			setShowForm(false);
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setCreating(false);
		}
	}

	return (
		<div container-id="admin-kb" className="flex flex-col gap-6">

			{/* Header */}
			<header
				container-id="admin-kb-header"
				className="flex items-start justify-between gap-4"
			>
				<div className="flex flex-col gap-1">
					<h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
					<p className="text-sm text-muted-foreground">{documents.length} document(s)</p>
				</div>
				<Button
					size="sm"
					onClick={() => setShowForm((v) => !v)}
				>
					<Plus className="size-3.5" aria-hidden />
					{showForm ? "Cancel" : "Add document"}
				</Button>
			</header>

			{/* Add form */}
			{showForm && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">New KB document</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1">
								<Label htmlFor="kb-title">Title *</Label>
								<Input
									id="kb-title"
									placeholder="Article title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
								/>
							</div>
							<div className="flex flex-col gap-1">
								<Label htmlFor="kb-url">Source URL (optional)</Label>
								<Input
									id="kb-url"
									type="url"
									placeholder="https://…"
									value={sourceUrl}
									onChange={(e) => setSourceUrl(e.target.value)}
								/>
							</div>
						</div>
						<div className="flex flex-col gap-1">
							<Label htmlFor="kb-content">Content *</Label>
							<Textarea
								id="kb-content"
								placeholder="Paste article text here…"
								value={content}
								onChange={(e) => setContent(e.target.value)}
								rows={8}
							/>
						</div>
						<div className="flex gap-2">
							<Button
								size="sm"
								onClick={createDocument}
								disabled={creating || !title.trim() || !content.trim()}
							>
								{creating ? "Adding + embedding…" : "Add document"}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowForm(false)}
							>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Document list */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Book className="size-4" aria-hidden />
						Documents
					</CardTitle>
				</CardHeader>
				<CardContent>
					{documents.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							No KB documents yet. Add one above.
						</p>
					) : (
						<div
							container-id="admin-kb-list"
							className="flex flex-col divide-y divide-border"
						>
							{documents.map((doc) => (
								<div
									key={doc.id}
									className="flex items-center justify-between gap-4 py-3"
								>
									<div className="flex flex-col gap-0.5">
										<span className="font-medium">{doc.title}</span>
										<div className="flex items-center gap-2">
											<span className="text-xs text-muted-foreground tabular-nums">
												{new Date(doc.createdAt).toLocaleDateString("en-PK")}
											</span>
											{doc.sourceUrl && (
												<a
													href={doc.sourceUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-1 text-xs text-primary hover:underline"
												>
													<ExternalLink className="size-3" aria-hidden />
													Source
												</a>
											)}
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => deleteDocument(doc.id)}
										disabled={loading === doc.id}
									>
										<Trash2 className="size-3.5 text-destructive" aria-hidden />
									</Button>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
