import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUp01Icon, Edit01Icon, Delete01Icon, Search01Icon, SortByDown01Icon, RefreshIcon } from '@hugeicons/core-free-icons'
import { Tooltip, TooltipTrigger, TooltipContent } from '../../ui/tooltip'
import { Switch } from '../../ui/switch'
import { StatusIndicator } from '../../ui/status-indicator'
import { useDictionaryStore } from '../../../store/useDictionaryStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog'
import { Button } from '../../ui/button'

export default function DictionaryContent() {
  const {
    entries,
    loadEntries,
    addEntry,
    addReplacement,
    updateEntry,
    deleteEntry,
  } = useDictionaryStore()
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortAsc, setSortAsc] = useState(true)
  const toggleSort = () => setSortAsc(!sortAsc)
  const refreshEntries = () => loadEntries()
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [editingEntry, setEditingEntry] = useState<{
    id: string
    type: 'normal' | 'replacement'
    content?: string
    from?: string
    to?: string
  } | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editFrom, setEditFrom] = useState('')
  const [editTo, setEditTo] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newEntryContent, setNewEntryContent] = useState('')
  const [newFrom, setNewFrom] = useState('')
  const [newTo, setNewTo] = useState('')
  const [isReplacement, setIsReplacement] = useState(false)
  const [statusIndicator, setStatusIndicator] = useState<
    'success' | 'error' | null
  >(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const containerRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const editFromRef = useRef<HTMLInputElement>(null)
  const addInputRef = useRef<HTMLInputElement>(null)
  const addFromRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop
        setShowScrollToTop(scrollTop > 200) // Show button after scrolling 200px
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }

    return undefined
  }, [])

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }

  const getDisplayText = (entry: (typeof entries)[0]) => {
    if (entry.type === 'replacement') {
      return `${entry.from} → ${entry.to}`
    }
    return entry.content
  }

  const handleEdit = (id: string) => {
    const entry = entries.find(e => e.id === id)
    if (entry) {
      if (entry.type === 'normal') {
        setEditingEntry({ id, type: 'normal', content: entry.content })
        setEditContent(entry.content)
        setEditFrom('')
        setEditTo('')
        // Focus the input after the dialog opens
        setTimeout(() => {
          editInputRef.current?.focus()
        }, 100)
      } else {
        setEditingEntry({
          id,
          type: 'replacement',
          from: entry.from,
          to: entry.to,
        })
        setEditContent('')
        setEditFrom(entry.from)
        setEditTo(entry.to)
        // Focus the first input after the dialog opens
        setTimeout(() => {
          editFromRef.current?.focus()
        }, 100)
      }
    }
  }

  const handleSaveEdit = async () => {
    if (!editingEntry) return

    try {
      if (editingEntry.type === 'normal' && editContent.trim() !== '') {
        await updateEntry(editingEntry.id, {
          type: 'normal',
          content: editContent.trim(),
        } as any)
        setEditingEntry(null)
        setEditContent('')
        setErrorMessage('')
        setSuccessMessage(`"${editContent.trim()}" updated successfully`)
        setStatusIndicator('success')
      } else if (
        editingEntry.type === 'replacement' &&
        editFrom.trim() !== '' &&
        editTo.trim() !== ''
      ) {
        await updateEntry(editingEntry.id, {
          type: 'replacement',
          from: editFrom.trim(),
          to: editTo.trim(),
        } as any)
        setEditingEntry(null)
        setEditFrom('')
        setEditTo('')
        setErrorMessage('')
        setSuccessMessage(
          `"${editFrom.trim()}" → "${editTo.trim()}" updated successfully`,
        )
        setStatusIndicator('success')
      }
    } catch (error: any) {
      console.error('Failed to update dictionary entry:', error)
      const errorMsg = error?.message || 'Failed to update dictionary entry'
      setErrorMessage(errorMsg)
      setStatusIndicator('error')
    }
  }

  const handleCancelEdit = () => {
    setEditingEntry(null)
    setEditContent('')
    setEditFrom('')
    setEditTo('')
  }

  const handleDelete = async (id: string) => {
    const entryToDelete = entries.find(e => e.id === id)
    if (entryToDelete) {
      const deletedItemText = getDisplayText(entryToDelete)
      try {
        await deleteEntry(id)
        setErrorMessage('')
        setSuccessMessage(`"${deletedItemText}" deleted successfully`)
        setStatusIndicator('success')
      } catch (error) {
        console.error('Failed to delete dictionary entry:', error)
        setErrorMessage(`Failed to delete "${deletedItemText}"`)
        setStatusIndicator('error')
      }
    }
  }

  const handleAddNew = () => {
    setShowAddDialog(true)
    setNewEntryContent('')
    setNewFrom('')
    setNewTo('')
    setIsReplacement(false)
    // Focus the input after the dialog opens
    setTimeout(() => {
      addInputRef.current?.focus()
    }, 100)
  }

  const handleSaveNew = async () => {
    try {
      if (isReplacement) {
        if (newFrom.trim() !== '' && newTo.trim() !== '') {
          await addReplacement(newFrom.trim(), newTo.trim())
          setShowAddDialog(false)
          setNewFrom('')
          setNewTo('')
          setErrorMessage('')
          setSuccessMessage(
            `"${newFrom.trim()}" → "${newTo.trim()}" added successfully`,
          )
          setStatusIndicator('success')
        }
      } else {
        if (newEntryContent.trim() !== '') {
          await addEntry(newEntryContent.trim())
          setShowAddDialog(false)
          setNewEntryContent('')
          setErrorMessage('')
          setSuccessMessage(`"${newEntryContent.trim()}" added successfully`)
          setStatusIndicator('success')
        }
      }
    } catch (error: any) {
      console.error('Failed to add dictionary entry:', error)
      const errorMsg = error?.message || 'Failed to add dictionary entry'
      setErrorMessage(errorMsg)
      setStatusIndicator('error')
    }
  }

  const handleCancelNew = () => {
    setShowAddDialog(false)
    setNewEntryContent('')
    setNewFrom('')
    setNewTo('')
    setIsReplacement(false)
  }

  const handleReplacementToggle = (checked: boolean) => {
    setIsReplacement(checked)
    // Focus appropriate input when toggling
    setTimeout(() => {
      if (checked) {
        addFromRef.current?.focus()
      } else {
        addInputRef.current?.focus()
      }
    }, 100)
  }

  // Handle keyboard shortcuts in dialogs
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveNew()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelNew()
    }
  }

  const filteredEntries = entries
    .filter(entry => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      if (entry.type === 'replacement') {
        return entry.from.toLowerCase().includes(q) || entry.to.toLowerCase().includes(q)
      }
      return entry.content.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const textA = a.type === 'replacement' ? a.from : a.content
      const textB = b.type === 'replacement' ? b.from : b.content
      return sortAsc
        ? textA.localeCompare(textB)
        : textB.localeCompare(textA)
    })

  const noEntries = entries.length === 0

  return (
    <div
      ref={containerRef}
      className="w-full px-12 max-h-160 overflow-y-auto relative"
      style={{
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[30px] font-semibold tracking-tight font-sans">Dictionary</h1>
        <button
          onClick={handleAddNew}
          className="bg-foreground text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors cursor-pointer"
        >
          Add new
        </button>
      </div>

      <div className="flex items-center justify-end mt-6 mb-4 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Search"
            aria-label="Search dictionary"
            onClick={() => {
              if (showSearch) setSearchQuery('')
              setShowSearch(!showSearch)
            }}
          >
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="w-4 h-4" />
          </button>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Sort"
            aria-label="Sort entries"
            onClick={toggleSort}
          >
            <HugeiconsIcon icon={SortByDown01Icon} strokeWidth={2} className="w-4 h-4" />
          </button>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Refresh"
            aria-label="Refresh entries"
            onClick={refreshEntries}
          >
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search dictionary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-transparent placeholder-muted-foreground"
            autoFocus
          />
        </div>
      )}

      {noEntries && (
        <div className="text-muted-foreground">
          <p className="text-sm">No entries yet</p>
          <p className="text-xs mt-1">
            Dictionary entries make the transcription more accurate
          </p>
        </div>
      )}
      {!noEntries && filteredEntries.length === 0 && (
        <div className="text-muted-foreground">
          <p className="text-sm">No matching entries</p>
        </div>
      )}
      {!noEntries && filteredEntries.length > 0 && (
        <div className="rounded-lg border border-border bg-background overflow-hidden divide-y divide-border shadow-md">
          {filteredEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center justify-between px-4 py-4 gap-10 hover:bg-muted transition-colors duration-200 group"
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <div className="text-foreground flex-1">
                {getDisplayText(entry)}
              </div>

              {/* Action Icons - shown on hover */}
              <div
                className={`flex items-center gap-2 transition-opacity duration-200 ${
                  hoveredRow === index ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleEdit(entry.id)}
                      className="p-1.5 hover:bg-muted rounded transition-colors cursor-pointer"
                      aria-label="Edit entry"
                    >
                      <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="w-4 h-4 text-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={5}>
                    Edit
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors cursor-pointer"
                      aria-label="Delete entry"
                    >
                      <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="w-4 h-4 text-foreground hover:text-red-600" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={5}>
                    Delete
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 bg-black text-white right-8 w-8 h-8 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center justify-center group z-50 cursor-pointer"
          aria-label="Scroll to top"
        >
          <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="w-4 h-4 font-bold" />
        </button>
      )}

      {/* Status Indicator */}
      <StatusIndicator
        status={statusIndicator}
        onHide={() => {
          setStatusIndicator(null)
          setErrorMessage('')
          setSuccessMessage('')
        }}
        successMessage={successMessage || 'Dictionary entry added successfully'}
        errorMessage={errorMessage || 'Failed to add dictionary entry'}
      />

      {/* Edit Entry Dialog */}
      <Dialog
        open={!!editingEntry}
        onOpenChange={open => !open && handleCancelEdit()}
      >
        <DialogContent
          className="!border-0 shadow-lg p-0"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="sr-only">
              {editingEntry?.type === 'replacement'
                ? 'Edit replacement'
                : 'Edit Dictionary Entry'}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingEntry?.type === 'replacement'
                ? 'Edit replacement'
                : 'Edit entry'}
            </h2>

            {editingEntry?.type === 'normal' ? (
              <input
                ref={editInputRef}
                type="text"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full p-4 rounded-xl resize-none focus:outline-none border border-border focus:ring-2 focus:ring-ring"
                placeholder="Enter dictionary entry..."
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    ref={editFromRef}
                    type="text"
                    value={editFrom}
                    onChange={e => setEditFrom(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="flex-1 p-4 rounded-xl resize-none focus:outline-none border border-border focus:ring-2 focus:ring-ring"
                    placeholder="Misspelling"
                  />
                  <span className="text-muted-foreground">→</span>
                  <input
                    type="text"
                    value={editTo}
                    onChange={e => setEditTo(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="flex-1 p-4 rounded-xl resize-none focus:outline-none border border-border focus:ring-2 focus:ring-ring"
                    placeholder="Correct spelling"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-4">
            <Button
              className="bg-muted hover:bg-muted text-foreground cursor-pointer"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleSaveEdit}
              disabled={
                editingEntry?.type === 'normal'
                  ? !editContent.trim()
                  : !editFrom.trim() || !editTo.trim()
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Entry Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={open => !open && handleCancelNew()}
      >
        <DialogContent
          className="!border-0 shadow-lg p-0"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="sr-only">Add to vocabulary</DialogTitle>
          </DialogHeader>
          <div className="px-6">
            <h2 className="text-lg font-semibold mb-4">Add to vocabulary</h2>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Make it a replacement</span>
              <Switch
                checked={isReplacement}
                onCheckedChange={handleReplacementToggle}
              />
            </div>

            {!isReplacement ? (
              <input
                ref={addInputRef}
                type="text"
                value={newEntryContent}
                onChange={e => setNewEntryContent(e.target.value)}
                onKeyDown={handleAddKeyDown}
                className="w-full p-4 rounded-xl resize-none focus:outline-none border border-border focus:ring-2 focus:ring-ring"
                placeholder="Enter dictionary entry..."
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    ref={addFromRef}
                    type="text"
                    value={newFrom}
                    onChange={e => setNewFrom(e.target.value)}
                    onKeyDown={handleAddKeyDown}
                    className="flex-1 p-4 rounded-xl resize-none focus:outline-none border border-border focus:ring-2 focus:ring-ring"
                    placeholder="Misspelling"
                  />
                  <span className="text-muted-foreground">→</span>
                  <input
                    type="text"
                    value={newTo}
                    onChange={e => setNewTo(e.target.value)}
                    onKeyDown={handleAddKeyDown}
                    className="flex-1 p-4 rounded-xl resize-none focus:outline-none border border-border focus:ring-2 focus:ring-ring"
                    placeholder="Correct spelling"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-4">
            <Button
              className="bg-muted hover:bg-muted text-foreground cursor-pointer"
              onClick={handleCancelNew}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleSaveNew}
              disabled={
                isReplacement
                  ? !newFrom.trim() || !newTo.trim()
                  : !newEntryContent.trim()
              }
            >
              Add word
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
