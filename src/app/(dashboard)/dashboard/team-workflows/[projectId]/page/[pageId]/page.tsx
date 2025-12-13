"use client";

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTeamWorkflow } from "@/context/TeamWorkflowContext";
import { useAuth } from "@/context/AuthContext";
import { Block, BlockType } from "@/types/collaboration";
import { generateId } from "@/services/teamWorkflowService";
import styles from "./page-editor.module.css";

const BLOCK_TYPES: { type: BlockType; label: string; shortcut: string }[] = [
  { type: "paragraph", label: "Text", shortcut: "p" },
  { type: "heading1", label: "Heading 1", shortcut: "h1" },
  { type: "heading2", label: "Heading 2", shortcut: "h2" },
  { type: "heading3", label: "Heading 3", shortcut: "h3" },
  { type: "bulletList", label: "Bullet List", shortcut: "ul" },
  { type: "numberedList", label: "Numbered List", shortcut: "ol" },
  { type: "todoList", label: "To-do List", shortcut: "todo" },
  { type: "quote", label: "Quote", shortcut: "quote" },
  { type: "code", label: "Code", shortcut: "code" },
  { type: "divider", label: "Divider", shortcut: "hr" },
  { type: "callout", label: "Callout", shortcut: "callout" },
];

interface SortableBlockProps {
  block: Block;
  isEditing: boolean;
  onContentChange: (id: string, content: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>, block: Block) => void;
  onFocus: (id: string) => void;
  onToggleCheck: (id: string) => void;
}

function SortableBlock({
  block,
  isEditing,
  onContentChange,
  onKeyDown,
  onFocus,
  onToggleCheck,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case "heading1":
        return (
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onContentChange(block.id, e.currentTarget.textContent || "")}
            onKeyDown={(e) => onKeyDown(e, block)}
            onFocus={() => onFocus(block.id)}
            data-placeholder="Heading 1"
            className={styles.editable}
          >
            {block.content}
          </h1>
        );
      case "heading2":
        return (
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onContentChange(block.id, e.currentTarget.textContent || "")}
            onKeyDown={(e) => onKeyDown(e, block)}
            onFocus={() => onFocus(block.id)}
            data-placeholder="Heading 2"
            className={styles.editable}
          >
            {block.content}
          </h2>
        );
      case "heading3":
        return (
          <h3
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onContentChange(block.id, e.currentTarget.textContent || "")}
            onKeyDown={(e) => onKeyDown(e, block)}
            onFocus={() => onFocus(block.id)}
            data-placeholder="Heading 3"
            className={styles.editable}
          >
            {block.content}
          </h3>
        );
      case "bulletList":
        return (
          <div className={styles.listItem}>
            <span className={styles.bullet}>•</span>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onContentChange(block.id, e.currentTarget.textContent || "")}
              onKeyDown={(e) => onKeyDown(e, block)}
              onFocus={() => onFocus(block.id)}
              data-placeholder="List item"
              className={styles.editable}
            >
              {block.content}
            </span>
          </div>
        );
      case "numberedList":
        return (
          <div className={styles.listItem}>
            <span className={styles.number}>{block.position + 1}.</span>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onContentChange(block.id, e.currentTarget.textContent || "")}
              onKeyDown={(e) => onKeyDown(e, block)}
              onFocus={() => onFocus(block.id)}
              data-placeholder="List item"
              className={styles.editable}
            >
              {block.content}
            </span>
          </div>
        );
      case "todoList":
        return (
          <div className={styles.todoItem}>
            <button
              className={`${styles.checkbox} ${block.properties?.checked ? styles.checked : ""}`}
              onClick={() => onToggleCheck(block.id)}
            >
              {block.properties?.checked && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onContentChange(block.id, e.currentTarget.textContent || "")}
              onKeyDown={(e) => onKeyDown(e, block)}
              onFocus={() => onFocus(block.id)}
              data-placeholder="To-do"
              className={`${styles.editable} ${block.properties?.checked ? styles.completed : ""}`}
            >
              {block.content}
            </span>
          </div>
        );
      case "quote":
        return (
          <blockquote
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onContentChange(block.id, e.currentTarget.textContent || "")}
            onKeyDown={(e) => onKeyDown(e, block)}
            onFocus={() => onFocus(block.id)}
            data-placeholder="Quote"
            className={styles.editable}
          >
            {block.content}
          </blockquote>
        );
      case "code":
        return (
          <pre className={styles.codeBlock}>
            <code
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onContentChange(block.id, e.currentTarget.textContent || "")}
              onKeyDown={(e) => onKeyDown(e, block)}
              onFocus={() => onFocus(block.id)}
              data-placeholder="Code"
              className={styles.editable}
            >
              {block.content}
            </code>
          </pre>
        );
      case "divider":
        return <hr className={styles.divider} />;
      case "callout":
        return (
          <div className={`${styles.callout} ${styles[block.properties?.calloutType || "info"]}`}>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onContentChange(block.id, e.currentTarget.textContent || "")}
              onKeyDown={(e) => onKeyDown(e, block)}
              onFocus={() => onFocus(block.id)}
              data-placeholder="Callout"
              className={styles.editable}
            >
              {block.content}
            </span>
          </div>
        );
      default:
        return (
          <p
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onContentChange(block.id, e.currentTarget.textContent || "")}
            onKeyDown={(e) => onKeyDown(e, block)}
            onFocus={() => onFocus(block.id)}
            data-placeholder="Type '/' for commands..."
            className={styles.editable}
          >
            {block.content}
          </p>
        );
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.blockWrapper}>
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>
      <div className={`${styles.block} ${styles[block.type]}`}>
        {renderBlockContent()}
      </div>
    </div>
  );
}

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const pageId = params.pageId as string;

  const { user } = useAuth();
  const {
    pages,
    loadPages,
    setCurrentPage,
    updatePage,
    updateBlocks,
    phantomPresences,
    startPresenceSimulation,
    stopPresenceSimulation,
  } = useTeamWorkflow();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuFilter, setBlockMenuFilter] = useState("");
  const [blockMenuPosition, setBlockMenuPosition] = useState({ top: 0, left: 0 });
  const [hasChanges, setHasChanges] = useState(false);

  const page = pages.find((p) => p.id === pageId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadPages(projectId);
  }, [loadPages, projectId]);

  useEffect(() => {
    if (page) {
      setCurrentPage(page);
      setBlocks(page.blocks);
      setTitle(page.title);
      startPresenceSimulation(projectId, pageId);
    }

    return () => {
      stopPresenceSimulation();
    };
  }, [page, projectId, pageId, setCurrentPage, startPresenceSimulation, stopPresenceSimulation]);

  // Auto-save
  useEffect(() => {
    if (!hasChanges || !page) return;

    const timer = setTimeout(() => {
      updateBlocks(pageId, blocks);
      if (title !== page.title) {
        updatePage(pageId, { title });
      }
      setHasChanges(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [blocks, title, hasChanges, pageId, page, updateBlocks, updatePage]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
          ...item,
          position: idx,
        }));
        return newItems;
      });
      setHasChanges(true);
    }
  };

  const handleContentChange = (id: string, content: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content } : b))
    );
    setHasChanges(true);
  };

  const handleToggleCheck = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, properties: { ...b.properties, checked: !b.properties?.checked } }
          : b
      )
    );
    setHasChanges(true);
  };

  const addBlock = (type: BlockType, afterId?: string) => {
    const newBlock: Block = {
      id: generateId("block"),
      type,
      content: "",
      position: blocks.length,
      properties: type === "todoList" ? { checked: false } : type === "callout" ? { calloutType: "info" } : undefined,
    };

    if (afterId) {
      const afterIndex = blocks.findIndex((b) => b.id === afterId);
      const newBlocks = [...blocks];
      newBlocks.splice(afterIndex + 1, 0, newBlock);
      setBlocks(newBlocks.map((b, i) => ({ ...b, position: i })));
    } else {
      setBlocks([...blocks, newBlock]);
    }
    setHasChanges(true);
    setShowBlockMenu(false);
    setBlockMenuFilter("");

    // Focus the new block
    setTimeout(() => {
      const element = document.querySelector(`[data-block-id="${newBlock.id}"] [contenteditable]`);
      if (element) {
        (element as HTMLElement).focus();
      }
    }, 50);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) return;
    const index = blocks.findIndex((b) => b.id === id);
    setBlocks((prev) =>
      prev.filter((b) => b.id !== id).map((b, i) => ({ ...b, position: i }))
    );
    setHasChanges(true);

    // Focus previous block
    if (index > 0) {
      const prevBlock = blocks[index - 1];
      setTimeout(() => {
        const element = document.querySelector(`[data-block-id="${prevBlock.id}"] [contenteditable]`);
        if (element) {
          (element as HTMLElement).focus();
        }
      }, 50);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>, block: Block) => {
    // Slash command
    if (e.key === "/" && block.content === "") {
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setBlockMenuPosition({ top: rect.bottom + 8, left: rect.left });
      setShowBlockMenu(true);
      setBlockMenuFilter("");
      return;
    }

    // Enter to create new block
    if (e.key === "Enter" && !e.shiftKey && block.type !== "code") {
      e.preventDefault();
      addBlock("paragraph", block.id);
      return;
    }

    // Backspace on empty block
    if (e.key === "Backspace" && block.content === "" && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(block.id);
      return;
    }
  };

  const filteredBlockTypes = BLOCK_TYPES.filter(
    (bt) =>
      bt.label.toLowerCase().includes(blockMenuFilter.toLowerCase()) ||
      bt.shortcut.includes(blockMenuFilter.toLowerCase())
  );

  if (!page) {
    return (
      <div className={styles.loading}>
        <p>Loading page...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link
            href={`/dashboard/team-workflows/${projectId}`}
            className={styles.backLink}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className={styles.pagePath}>
            {page.title || "Untitled"}
          </span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.presenceRow}>
            {phantomPresences.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className={styles.presenceAvatar}
                style={{ backgroundColor: p.color }}
                title={`${p.userName} is viewing`}
              >
                {p.userName.charAt(0)}
              </div>
            ))}
          </div>
          {hasChanges ? (
            <span className={styles.savingStatus}>Saving...</span>
          ) : (
            <span className={styles.savedStatus}>Saved</span>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className={styles.editor}>
        <div className={styles.editorContent}>
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Untitled"
            className={styles.titleInput}
          />

          {/* Blocks */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={styles.blocks}>
                {blocks.map((block) => (
                  <div key={block.id} data-block-id={block.id}>
                    <SortableBlock
                      block={block}
                      isEditing={focusedBlockId === block.id}
                      onContentChange={handleContentChange}
                      onKeyDown={handleKeyDown}
                      onFocus={setFocusedBlockId}
                      onToggleCheck={handleToggleCheck}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add block button */}
          <button
            className={styles.addBlockBtn}
            onClick={() => addBlock("paragraph")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add a block
          </button>
        </div>
      </div>

      {/* Block Menu */}
      <AnimatePresence>
        {showBlockMenu && (
          <>
            <div
              className={styles.menuOverlay}
              onClick={() => {
                setShowBlockMenu(false);
                setBlockMenuFilter("");
              }}
            />
            <motion.div
              className={styles.blockMenu}
              style={{ top: blockMenuPosition.top, left: blockMenuPosition.left }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <input
                type="text"
                value={blockMenuFilter}
                onChange={(e) => setBlockMenuFilter(e.target.value)}
                placeholder="Filter..."
                className={styles.menuSearch}
                autoFocus
              />
              <div className={styles.menuItems}>
                {filteredBlockTypes.map((bt) => (
                  <button
                    key={bt.type}
                    className={styles.menuItem}
                    onClick={() => {
                      if (focusedBlockId) {
                        // Change current block type
                        setBlocks((prev) =>
                          prev.map((b) =>
                            b.id === focusedBlockId ? { ...b, type: bt.type } : b
                          )
                        );
                        setHasChanges(true);
                      } else {
                        addBlock(bt.type);
                      }
                      setShowBlockMenu(false);
                      setBlockMenuFilter("");
                    }}
                  >
                    <span className={styles.menuLabel}>{bt.label}</span>
                    <span className={styles.menuShortcut}>/{bt.shortcut}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
