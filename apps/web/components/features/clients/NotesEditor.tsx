/**
 * NotesEditor Component
 * 
 * Editor for client notes and tags.
 * Allows adding, editing, and deleting notes, as well as managing tags.
 */

'use client';

import { useState, useMemo } from 'react';
import { useClient, useUpdateClient } from '@/lib/hooks/useClients';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Note, ClientMetadata } from '@/types/client';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { StickyNote, Plus, X, Tag, Trash2, Edit2 } from 'lucide-react';

interface NotesEditorProps {
  clientId: string;
}

export default function NotesEditor({ clientId }: NotesEditorProps) {
  const { toast } = useToast();
  const { data: client, isLoading } = useClient(clientId);
  const updateClientMutation = useUpdateClient();

  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [newTag, setNewTag] = useState('');

  const metadata: ClientMetadata = client?.metadata || {};
  const notes: Note[] = metadata.notes || [];
  const tags: string[] = metadata.tags || [];

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter note content',
        variant: 'error',
      });
      return;
    }

    if (!client) return;

    const currentMetadata: ClientMetadata = client.metadata || {};
    const currentNotes = currentMetadata.notes || [];
    const newNote: Note = {
      id: crypto.randomUUID(),
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
      createdBy: 'current-user', // TODO: Get actual user ID from auth context
    };

    const updatedMetadata: ClientMetadata = {
      ...currentMetadata,
      notes: [...currentNotes, newNote],
    };

    try {
      await updateClientMutation.mutateAsync({
        id: clientId,
        data: {
          metadata: updatedMetadata,
        },
      });

      toast({
        title: 'Success',
        description: 'Note added successfully',
        variant: 'success',
      });

      setNewNoteContent('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add note',
        variant: 'error',
      });
    }
  };

  const handleEditNote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      setEditingNoteId(noteId);
      setEditingNoteContent(note.content);
    }
  };

  const handleSaveNote = async () => {
    if (!editingNoteId || !editingNoteContent.trim() || !client) return;

    const currentMetadata: ClientMetadata = client.metadata || {};
    const currentNotes = currentMetadata.notes || [];
    const updatedNotes = currentNotes.map((note) =>
      note.id === editingNoteId
        ? { ...note, content: editingNoteContent.trim() }
        : note
    );

    const updatedMetadata: ClientMetadata = {
      ...currentMetadata,
      notes: updatedNotes,
    };

    try {
      await updateClientMutation.mutateAsync({
        id: clientId,
        data: {
          metadata: updatedMetadata,
        },
      });

      toast({
        title: 'Success',
        description: 'Note updated successfully',
        variant: 'success',
      });

      setEditingNoteId(null);
      setEditingNoteContent('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update note',
        variant: 'error',
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    if (!client) return;

    const currentMetadata: ClientMetadata = client.metadata || {};
    const currentNotes = currentMetadata.notes || [];
    const updatedNotes = currentNotes.filter((note) => note.id !== noteId);

    const updatedMetadata: ClientMetadata = {
      ...currentMetadata,
      notes: updatedNotes,
    };

    try {
      await updateClientMutation.mutateAsync({
        id: clientId,
        data: {
          metadata: updatedMetadata,
        },
      });

      toast({
        title: 'Success',
        description: 'Note deleted successfully',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete note',
        variant: 'error',
      });
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a tag',
        variant: 'error',
      });
      return;
    }

    const tagToAdd = newTag.trim().toLowerCase();
    if (tags.includes(tagToAdd)) {
      toast({
        title: 'Error',
        description: 'Tag already exists',
        variant: 'error',
      });
      return;
    }

    if (!client) return;

    const currentMetadata: ClientMetadata = client.metadata || {};
    const updatedMetadata: ClientMetadata = {
      ...currentMetadata,
      tags: [...tags, tagToAdd],
    };

    try {
      await updateClientMutation.mutateAsync({
        id: clientId,
        data: {
          metadata: updatedMetadata,
        },
      });

      toast({
        title: 'Success',
        description: 'Tag added successfully',
        variant: 'success',
      });

      setNewTag('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add tag',
        variant: 'error',
      });
    }
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    if (!client) return;

    const currentMetadata: ClientMetadata = client.metadata || {};
    const updatedTags = tags.filter((tag) => tag !== tagToDelete);

    const updatedMetadata: ClientMetadata = {
      ...currentMetadata,
      tags: updatedTags,
    };

    try {
      await updateClientMutation.mutateAsync({
        id: clientId,
        data: {
          metadata: updatedMetadata,
        },
      });

      toast({
        title: 'Success',
        description: 'Tag removed successfully',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to remove tag',
        variant: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tags Section */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Tag className="h-5 w-5" />
          Tags ({tags.length})
        </h3>

        {/* Add Tag Form */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add a tag..."
            className="flex-1 w-full"
          />
          <Button
            onClick={handleAddTag}
            disabled={updateClientMutation.isPending}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Tags List */}
        {tags.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <Tag className="h-10 w-10 mx-auto mb-3 text-text-tertiary" />
                <p className="text-text-secondary text-sm">No tags yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-lg text-sm"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleDeleteTag(tag)}
                  className="hover:text-primary-600 dark:hover:text-primary-300"
                  disabled={updateClientMutation.isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
          <StickyNote className="h-5 w-5" />
          Notes ({notes.length})
        </h3>

        {/* Add Note Form */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Input
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Add a note..."
                className="w-full"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddNote}
                  disabled={updateClientMutation.isPending || !newNoteContent.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes List */}
        {notes.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <StickyNote className="h-12 w-12 mx-auto mb-4 text-text-tertiary" />
                <p className="text-text-secondary mb-2">No notes yet</p>
                <p className="text-sm text-text-tertiary">
                  Add notes to keep track of important information about this client
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="pt-6">
                  {editingNoteId === note.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editingNoteContent}
                        onChange={(e) => setEditingNoteContent(e.target.value)}
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveNote}
                          disabled={updateClientMutation.isPending || !editingNoteContent.trim()}
                          size="sm"
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditingNoteContent('');
                          }}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0 w-full">
                        <p className="text-sm sm:text-base text-text-primary whitespace-pre-wrap break-words">{note.content}</p>
                        <p className="text-xs text-text-tertiary mt-2">
                          {formatDate(note.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2 self-start sm:self-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNote(note.id)}
                          disabled={updateClientMutation.isPending}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={updateClientMutation.isPending}
                          className="text-error-600 hover:text-error-700 hover:bg-error-50 dark:hover:bg-error-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

