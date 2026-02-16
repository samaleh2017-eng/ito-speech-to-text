import React from 'react'
import { Pencil, Copy, Trash, Dots } from '@mynaui/icons-react'
import type { Note } from '../../store/useNotesStore'

interface NoteProps {
  note: Note
  index: number
  showDropdown: number | null
  onEdit: (noteId: string) => void
  onToggleDropdown: (index: number, e: React.MouseEvent) => void
  onCopyToClipboard: (content: string) => void
  onDeleteNote: (noteId: string) => void
  formatDate: (date: Date) => string
  formatTime: (date: Date) => string
  truncateContent: (content: string, maxLength?: number) => string
  searchQuery?: string
}

// Function to highlight matching text
function highlightText(text: string, searchQuery: string): React.ReactElement {
  if (!searchQuery.trim()) {
    return <>{text}</>
  }

  const regex = new RegExp(
    `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi',
  )
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, index) => {
        if (regex.test(part)) {
          return (
            <span key={index} className="bg-yellow-200 font-medium">
              {part}
            </span>
          )
        }
        return part
      })}
    </>
  )
}

export function Note({
  note,
  index,
  showDropdown,
  onEdit,
  onToggleDropdown,
  onCopyToClipboard,
  onDeleteNote,
  formatDate,
  formatTime,
  truncateContent,
  searchQuery,
}: NoteProps) {
  // Determine what content to display
  const displayContent = searchQuery
    ? note.content
    : truncateContent(note.content)

  return (
    <div
      key={note.id}
      className="bg-warm-50 rounded-xl border border-warm-100 p-4 hover:shadow-md group relative transition-shadow duration-200"
    >
      {/* Hover Icons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:shadow-sm group-hover:opacity-100 transition-opacity duration-200 flex items-center rounded-md">
        <button
          onClick={e => {
            e.stopPropagation()
            onEdit(note.id)
          }}
          className="p-1.5 hover:bg-warm-100 transition-colors border-r border-warm-100 rounded-l-md cursor-pointer "
        >
          <Pencil className="w-4 h-4 text-warm-600" />
        </button>
        <div className="relative">
          <button
            onClick={e => onToggleDropdown(index, e)}
            className="p-1.5 hover:bg-warm-100 transition-colors rounded-r-md cursor-pointer"
          >
            <Dots className="w-4 h-4 text-foreground" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown === index && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-warm-100 rounded-xl shadow-lg z-10">
              <button
                onClick={e => {
                  e.stopPropagation()
                  onCopyToClipboard(note.content)
                }}
                className="w-full px-4 py-2 text-left text-sm text-warm-700 hover:bg-warm-50 flex items-center gap-2 rounded-t-xl cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                Copy to clipboard
              </button>
              <button
                onClick={e => {
                  e.stopPropagation()
                  onDeleteNote(note.id)
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-xl cursor-pointer"
              >
                <Trash className="w-4 h-4" />
                Delete note
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="mb-4 pr-16">
          <div className="text-foreground font-normal text-sm leading-relaxed break-words">
            {searchQuery
              ? highlightText(displayContent, searchQuery)
              : displayContent}
          </div>
        </div>
        <div className="flex items-center justify-between text-warm-500 text-xs mt-auto">
          <span>{formatDate(new Date(note.created_at))}</span>
          <span>{formatTime(new Date(note.created_at))}</span>
        </div>
      </div>
    </div>
  )
}
