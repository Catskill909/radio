'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import * as Dialog from '@radix-ui/react-dialog';
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Check } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ModalContentEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (content: string) => void;
    initialContent: string;
    icon: string;
    header: string;
    size: 'compact' | 'standard' | 'expanded';
}

// Size configurations matching InfoModal.tsx
const SIZE_CONFIG = {
    compact: {
        width: 'max-w-md',      // 448px
        maxHeight: 'max-h-[50vh]',
    },
    standard: {
        width: 'max-w-xl',      // 576px
        maxHeight: 'max-h-[65vh]',
    },
    expanded: {
        width: 'max-w-3xl',     // 768px
        maxHeight: 'max-h-[80vh]',
    },
};

// Toolbar button component
function ToolbarButton({
    onClick,
    isActive,
    icon: Icon,
    title,
}: {
    onClick: () => void;
    isActive?: boolean;
    icon: React.ElementType;
    title: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                p-2 rounded-md transition-all cursor-pointer
                ${isActive
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }
            `}
            title={title}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}

export default function ModalContentEditor({
    isOpen,
    onClose,
    onSave,
    initialContent,
    icon,
    header,
    size,
}: ModalContentEditorProps) {
    const sizeConfig = SIZE_CONFIG[size];
    const [hasChanges, setHasChanges] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                codeBlock: false,
                code: false,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-400 underline hover:text-blue-300',
                },
            }),
        ],
        content: initialContent || '',
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[120px]',
            },
        },
        onUpdate: () => {
            setHasChanges(true);
        },
    });

    useEffect(() => {
        if (editor && initialContent !== editor.getHTML()) {
            editor.commands.setContent(initialContent || '');
        }
    }, [initialContent, editor]);

    // Simple prompt-based link insertion
    const insertLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href || '';
        const url = window.prompt('Enter URL:', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    }, [editor]);

    const handleSave = () => {
        if (editor) {
            onSave(editor.getHTML());
        }
        onClose();
    };

    if (!editor) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[80] backdrop-blur-sm animate-fade-in" />

                <Dialog.Content
                    className="fixed inset-0 z-[90] flex flex-col items-center justify-center p-4 outline-none"
                    aria-describedby={undefined}
                >
                    <Dialog.Title className="sr-only">Edit Modal Content</Dialog.Title>

                    {/* Toolbar */}
                    <div className="mb-2 flex items-center gap-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            isActive={editor.isActive('bold')}
                            icon={Bold}
                            title="Bold (Ctrl+B)"
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            isActive={editor.isActive('italic')}
                            icon={Italic}
                            title="Italic (Ctrl+I)"
                        />
                        <div className="w-px h-5 bg-gray-600 mx-1" />
                        <ToolbarButton
                            onClick={insertLink}
                            isActive={editor.isActive('link')}
                            icon={LinkIcon}
                            title="Insert Link"
                        />
                        <div className="w-px h-5 bg-gray-600 mx-1" />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            isActive={editor.isActive('bulletList')}
                            icon={List}
                            title="Bullet List"
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            isActive={editor.isActive('orderedList')}
                            icon={ListOrdered}
                            title="Numbered List"
                        />
                        <div className="w-px h-5 bg-gray-600 mx-2" />
                        <button
                            onClick={handleSave}
                            className={`flex items-center gap-1.5 px-4 py-1.5 text-white text-sm font-medium rounded-md transition-all cursor-pointer
                                ${hasChanges
                                    ? 'bg-blue-600 hover:bg-blue-500 border border-blue-500'
                                    : 'bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500'
                                }`}
                        >
                            <Check className="w-4 h-4" />
                            Save
                        </button>
                    </div>

                    {/* Modal Preview */}
                    <div
                        className={`
                            bg-gray-950 border border-gray-800 shadow-2xl rounded-2xl
                            overflow-hidden flex flex-col w-full
                            ${sizeConfig.width} ${sizeConfig.maxHeight}
                        `}
                    >
                        <div className="relative p-6 pb-4 border-b border-gray-800/50 flex-shrink-0">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 hover:rotate-90 outline-none cursor-pointer"
                                aria-label="Close"
                            >
                                <span className="text-lg">×</span>
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-800/80 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i className={`${icon} text-xl text-gray-200`} />
                                </div>
                                <h2 className="text-xl font-bold text-white pr-10">
                                    {header || 'Modal Title'}
                                </h2>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 thin-scrollbar">
                            <EditorContent
                                editor={editor}
                                className="text-gray-300 leading-relaxed"
                            />
                        </div>
                    </div>

                    <p className="mt-3 text-sm text-gray-500">
                        Click outside or press Escape to cancel
                    </p>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
