import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Plus, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface SessionNote {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface SessionNotesProps {
  sessionId: string;
  readOnly?: boolean;
}

export function SessionNotes({ sessionId, readOnly = false }: SessionNotesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [sessionId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('session_notes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('session_notes')
        .insert({
          session_id: sessionId,
          content: newNote.trim(),
          created_by: user.id,
        });

      if (error) throw error;

      setNewNote('');
      fetchNotes();
      toast({
        title: 'Note added',
        description: 'Your note has been saved successfully.',
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add note. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('session_notes')
        .update({ content: editContent.trim() })
        .eq('id', noteId);

      if (error) throw error;

      setEditingId(null);
      setEditContent('');
      fetchNotes();
      toast({
        title: 'Note updated',
        description: 'Your note has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update note. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('session_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      fetchNotes();
      toast({
        title: 'Note deleted',
        description: 'Your note has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
      });
    }
  };

  const startEditing = (note: SessionNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <MessageSquare className="h-5 w-5" />
          Session Notes
        </CardTitle>
        <CardDescription>
          Add observations and comments about this interview session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        {!readOnly && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add a note about this session..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || saving}
              size="sm"
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Note
            </Button>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No notes yet. {!readOnly && 'Add your first note above.'}
            </p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-muted/50 rounded-lg border border-border/50"
              >
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={saving}
                        className="gap-1"
                      >
                        {saving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                        className="gap-1"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), 'MMM dd, yyyy HH:mm')}
                        {note.updated_at !== note.created_at && ' (edited)'}
                      </span>
                      {!readOnly && note.created_by === user?.id && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(note)}
                            className="h-7 px-2"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-7 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
