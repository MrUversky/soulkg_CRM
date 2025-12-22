/**
 * QuickActionsPanel Component
 * 
 * Provides quick action buttons for common client operations:
 * - Call client (tel: link)
 * - Assign partner (opens form)
 * - Add note (opens form)
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Phone, UserPlus, StickyNote } from 'lucide-react';
import { Client } from '@/types/client';
import { formatPhone } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface QuickActionsPanelProps {
  client: Client;
  onPartnerAssigned?: () => void;
  onNoteAdded?: () => void;
}

export default function QuickActionsPanel({
  client,
  onPartnerAssigned,
  onNoteAdded,
}: QuickActionsPanelProps) {
  const { toast } = useToast();
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [partnerId, setPartnerId] = useState('');
  const [noteText, setNoteText] = useState('');

  const handleCall = () => {
    window.location.href = `tel:${client.phone}`;
  };

  const handleAssignPartner = async () => {
    if (!partnerId.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a partner',
        variant: 'error',
      });
      return;
    }

    // TODO: Implement API call to assign partner
    // For now, just show a toast
    toast({
      title: 'Coming Soon',
      description: 'Partner assignment will be available soon',
      variant: 'info',
    });
    setShowPartnerForm(false);
    setPartnerId('');
    onPartnerAssigned?.();
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a note',
        variant: 'error',
      });
      return;
    }

    // TODO: Implement API call to add note to metadata
    // For now, just show a toast
    toast({
      title: 'Coming Soon',
      description: 'Note adding will be available soon',
      variant: 'info',
    });
    setShowNoteForm(false);
    setNoteText('');
    onNoteAdded?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {/* Call Button */}
          <Button
            variant="default"
            fullWidth
            onClick={handleCall}
            className="justify-start text-sm sm:text-base"
          >
            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Call {formatPhone(client.phone)}</span>
          </Button>

          {/* Assign Partner */}
          {!showPartnerForm ? (
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowPartnerForm(true)}
              className="justify-start text-sm sm:text-base"
            >
              <UserPlus className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Assign Partner</span>
            </Button>
          ) : (
            <div className="space-y-3 p-3 sm:p-4 border border-border rounded-lg bg-surface">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text-primary mb-2">
                  Partner
                </label>
                <input
                  type="text"
                  placeholder="Partner ID (coming soon)"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="flex h-9 sm:h-10 w-full rounded-lg border border-input/50 bg-background/50 backdrop-blur-sm px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled
                />
                <p className="text-xs text-text-tertiary mt-1">
                  Partner selection will be available soon
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAssignPartner}
                  disabled
                  className="text-xs sm:text-sm"
                >
                  Assign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowPartnerForm(false);
                    setPartnerId('');
                  }}
                  className="text-xs sm:text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Add Note */}
          {!showNoteForm ? (
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowNoteForm(true)}
              className="justify-start text-sm sm:text-base"
            >
              <StickyNote className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Add Note</span>
            </Button>
          ) : (
            <div className="space-y-3 p-3 sm:p-4 border border-border rounded-lg bg-surface">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text-primary mb-2">
                  Note
                </label>
                <textarea
                  placeholder="Enter your note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-lg border border-input/50 bg-background/50 backdrop-blur-sm px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAddNote}
                  disabled
                  className="text-xs sm:text-sm"
                >
                  Save Note
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNoteForm(false);
                    setNoteText('');
                  }}
                  className="text-xs sm:text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

