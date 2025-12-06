'use client';

import { useState, useTransition } from 'react';
import { Trash2, Plus, ExternalLink, GripVertical } from 'lucide-react';
import Switch from './Switch';
import { updateMenuSettings } from '@/app/actions';

export interface MenuItem {
    id: string;
    order: number;
    label: string;
    icon: string;
    actionType: 'url' | 'modal';
    url?: string;
    modalHeader?: string;
    modalBody?: string;
}

interface CustomMenuFormProps {
    initialMenuEnabled: boolean;
    initialMenuItems: MenuItem[];
}

// Default placeholder items
const DEFAULT_MENU_ITEMS: MenuItem[] = [
    { id: crypto.randomUUID(), order: 1, label: 'About Us', icon: 'fa-solid fa-info-circle', actionType: 'url', url: 'https://example.com/about' },
    { id: crypto.randomUUID(), order: 2, label: 'Schedule', icon: 'fa-solid fa-calendar-days', actionType: 'url', url: 'https://example.com/schedule' },
    { id: crypto.randomUUID(), order: 3, label: 'Podcast', icon: 'fa-solid fa-podcast', actionType: 'url', url: 'https://example.com/podcast' },
    { id: crypto.randomUUID(), order: 4, label: 'Contact', icon: 'fa-solid fa-envelope', actionType: 'modal', modalHeader: 'Contact Us', modalBody: 'Email: hello@station.com\n\nPhone: (555) 123-4567\n\nWe\'d love to hear from you!' },
    { id: crypto.randomUUID(), order: 5, label: 'About the Station', icon: 'fa-solid fa-radio', actionType: 'modal', modalHeader: 'About Our Station', modalBody: 'Welcome to our radio station!\n\nWe broadcast 24/7 with the best music and shows.\n\nThanks for listening!' },
];

export default function CustomMenuForm({ initialMenuEnabled, initialMenuItems }: CustomMenuFormProps) {
    const [menuEnabled, setMenuEnabled] = useState(initialMenuEnabled);
    const [menuItems, setMenuItems] = useState<MenuItem[]>(
        initialMenuItems.length > 0 ? initialMenuItems : DEFAULT_MENU_ITEMS
    );
    const [isPending, startTransition] = useTransition();
    const [saveMessage, setSaveMessage] = useState('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleAddItem = () => {
        if (menuItems.length >= 8) return;
        const newItem: MenuItem = {
            id: crypto.randomUUID(),
            order: menuItems.length + 1,
            label: 'New Item',
            icon: 'fa-solid fa-star',
            actionType: 'url',
            url: 'https://example.com',
        };
        setMenuItems([...menuItems, newItem]);
    };

    const handleDeleteItem = (id: string) => {
        setMenuItems(menuItems.filter(item => item.id !== id));
    };

    const handleUpdateItem = (id: string, updates: Partial<MenuItem>) => {
        setMenuItems(menuItems.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    };

    // Drag and Drop handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            const newItems = [...menuItems];
            const [draggedItem] = newItems.splice(draggedIndex, 1);
            newItems.splice(dragOverIndex, 0, draggedItem);
            // Update order values
            const reordered = newItems.map((item, i) => ({ ...item, order: i + 1 }));
            setMenuItems(reordered);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveMessage('');

        // Sort by order before saving
        const sortedItems = [...menuItems].sort((a, b) => a.order - b.order);

        startTransition(async () => {
            try {
                await updateMenuSettings(menuEnabled, sortedItems);
                setSaveMessage('Menu settings saved successfully!');
                setTimeout(() => setSaveMessage(''), 3000);
            } catch (error) {
                setSaveMessage('Error saving settings. Please try again.');
                console.error(error);
            }
        });
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header with Master Toggle */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                    <div>
                        <h3 className="text-lg font-medium text-white">Menu Items</h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Configure the floating menu. Drag to reorder.
                        </p>
                    </div>
                    <Switch
                        checked={menuEnabled}
                        onChange={setMenuEnabled}
                        label="Show Menu"
                    />
                </div>

                {/* Menu Items List */}
                <div className="space-y-3">
                    {menuItems.map((item, index) => (
                        <MenuItemEditor
                            key={item.id}
                            item={item}
                            index={index}
                            onUpdate={(updates) => handleUpdateItem(item.id, updates)}
                            onDelete={() => handleDeleteItem(item.id)}
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            isDragging={draggedIndex === index}
                            isDragOver={dragOverIndex === index}
                        />
                    ))}
                </div>

                {/* Add Button */}
                {menuItems.length < 8 && (
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white border border-dashed border-gray-700 hover:border-gray-500 rounded-lg transition-colors w-full justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        Add Menu Item ({menuItems.length}/8)
                    </button>
                )}

                {/* Save Button */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-blue-500/50 hover:border-blue-500 bg-transparent hover:bg-blue-500/5 text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Saving...' : 'Save Menu Settings'}
                    </button>
                    {saveMessage && (
                        <span
                            className={`text-sm font-medium animate-fade-in ${saveMessage.includes('Error')
                                ? 'text-red-400'
                                : 'text-green-400'
                                }`}
                        >
                            {saveMessage}
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}

// Sub-component for individual menu item editing
interface MenuItemEditorProps {
    item: MenuItem;
    index: number;
    onUpdate: (updates: Partial<MenuItem>) => void;
    onDelete: () => void;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    isDragging: boolean;
    isDragOver: boolean;
}

function MenuItemEditor({
    item,
    index,
    onUpdate,
    onDelete,
    onDragStart,
    onDragOver,
    onDragEnd,
    isDragging,
    isDragOver
}: MenuItemEditorProps) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            className={`
                bg-gray-800/50 rounded-lg p-4 border transition-all
                ${isDragging ? 'opacity-50 border-blue-500' : 'border-gray-700/50'}
                ${isDragOver ? 'border-blue-400 border-dashed' : ''}
            `}
        >
            <div className="flex gap-3">
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 pt-1">
                    <GripVertical className="w-5 h-5" />
                </div>

                {/* Form Content - vertical stack */}
                <div className="flex-1 space-y-3">
                    {/* Row 1: Icon + Preview + Label + Delete */}
                    <div className="flex items-end gap-3">
                        {/* Icon Field */}
                        <div className="w-64">
                            <label className="block text-xs text-gray-400 mb-1">Icon</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={item.icon}
                                    onChange={(e) => onUpdate({ icon: e.target.value })}
                                    placeholder="fa-solid fa-star"
                                    className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500"
                                />
                                <div className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i className={`${item.icon} text-gray-300 text-sm`} />
                                </div>
                                <a
                                    href="https://fontawesome.com/search?ic=free-collection"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300"
                                    title="Browse icons"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        {/* Menu Title Field */}
                        <div className="w-40">
                            <label className="block text-xs text-gray-400 mb-1">Menu Title</label>
                            <input
                                type="text"
                                value={item.label}
                                onChange={(e) => onUpdate({ label: e.target.value })}
                                placeholder="About Us"
                                maxLength={20}
                                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500"
                            />
                        </div>

                        {/* Delete */}
                        <button
                            type="button"
                            onClick={onDelete}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors mb-0.5"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Row 2: Type + URL/Modal - aligned with Icon input above */}
                    <div className="flex items-start gap-3">
                        {/* Action Type + Content - takes same space as Icon field */}
                        <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">Action</label>
                            <div className="flex items-start gap-3">
                                <div className="flex items-center gap-3 pt-1.5 flex-shrink-0">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={item.actionType === 'url'}
                                            onChange={() => onUpdate({ actionType: 'url' })}
                                            className="text-blue-500"
                                        />
                                        <span className="text-sm text-gray-300">URL</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={item.actionType === 'modal'}
                                            onChange={() => onUpdate({ actionType: 'modal' })}
                                            className="text-blue-500"
                                        />
                                        <span className="text-sm text-gray-300">Modal</span>
                                    </label>
                                </div>
                                <div className="w-96">
                                    {item.actionType === 'url' ? (
                                        <input
                                            type="url"
                                            value={item.url || ''}
                                            onChange={(e) => onUpdate({ url: e.target.value })}
                                            placeholder="https://example.com"
                                            className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500"
                                        />
                                    ) : (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={item.modalHeader || ''}
                                                onChange={(e) => onUpdate({ modalHeader: e.target.value })}
                                                placeholder="Modal title"
                                                maxLength={50}
                                                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500"
                                            />
                                            <textarea
                                                value={item.modalBody || ''}
                                                onChange={(e) => onUpdate({ modalBody: e.target.value })}
                                                placeholder="Modal content"
                                                rows={3}
                                                maxLength={2000}
                                                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 resize-y min-h-[60px]"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
}
