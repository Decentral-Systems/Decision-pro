"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Textarea component - using native textarea for now
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomerNotes, useCreateCustomerNote, useUpdateCustomerNote, useDeleteCustomerNote } from "@/lib/api/hooks/useCustomers";
import { Plus, Edit, Trash2, FileText, Calendar, User } from "lucide-react";
import { formatDate } from "@/lib/utils/customer360Transform";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CustomerNotesProps {
  customerId: string;
}

export function CustomerNotes({ customerId }: CustomerNotesProps) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [noteTags, setNoteTags] = useState("");

  const { data, isLoading, error } = useCustomerNotes(customerId);
  const createNote = useCreateCustomerNote();
  const updateNote = useUpdateCustomerNote();
  const deleteNote = useDeleteCustomerNote();

  const notes = data?.items || [];

  const handleCreateNote = async () => {
    if (!noteContent.trim()) {
      toast({
        title: "Error",
        description: "Note content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      await createNote.mutateAsync({
        customerId,
        note: {
          content: noteContent,
          type: noteType,
          tags: noteTags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      });
      toast({
        title: "Success",
        description: "Note created successfully",
      });
      setIsCreateDialogOpen(false);
      setNoteContent("");
      setNoteType("general");
      setNoteTags("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create note",
        variant: "destructive",
      });
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!noteContent.trim()) {
      toast({
        title: "Error",
        description: "Note content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateNote.mutateAsync({
        customerId,
        noteId,
        note: {
          content: noteContent,
          type: noteType,
          tags: noteTags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      });
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
      setEditingNoteId(null);
      setNoteContent("");
      setNoteType("general");
      setNoteTags("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      await deleteNote.mutateAsync({ customerId, noteId });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const startEditing = (note: any) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content || "");
    setNoteType(note.type || "general");
    setNoteTags((note.tags || []).join(", "));
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setNoteContent("");
    setNoteType("general");
    setNoteTags("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading notes...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading notes: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Customer Notes
              </CardTitle>
              <CardDescription>Add and manage notes for this customer</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Note</DialogTitle>
                  <DialogDescription>Create a new note for this customer</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Note Type</Label>
                    <Select value={noteType} onValueChange={setNoteType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="issue">Issue</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Enter note content..."
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={noteTags}
                      onChange={(e) => setNoteTags(e.target.value)}
                      placeholder="e.g., important, follow-up, payment"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNote} disabled={createNote.isPending}>
                    {createNote.isPending ? "Creating..." : "Create Note"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notes yet. Add a note to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note: any) => (
                <Card key={note.id} className="relative">
                  <CardContent className="pt-6">
                    {editingNoteId === note.id ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Note Type</Label>
                          <Select value={noteType} onValueChange={setNoteType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="call">Call</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="issue">Issue</SelectItem>
                              <SelectItem value="follow_up">Follow Up</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Content</Label>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            rows={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tags (comma-separated)</Label>
                          <Input
                            value={noteTags}
                            onChange={(e) => setNoteTags(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={updateNote.isPending}
                          >
                            {updateNote.isPending ? "Saving..." : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{note.type || "general"}</Badge>
                            {note.tags && note.tags.length > 0 && (
                              <div className="flex gap-1">
                                {note.tags.map((tag: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEditing(note)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                          {note.created_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(note.created_at)}
                            </div>
                          )}
                          {note.created_by && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {note.created_by}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

