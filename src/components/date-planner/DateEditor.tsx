import React from 'react';
import { Plus, Upload, Save, Download, Share2, Trash2 } from 'lucide-react';

interface Stop {
    time: string;
    loc: string;
    desc: string;
    color: string;
    label: string;
}

interface DateEditorProps {
    stops: Stop[];
    title: string;
    onTitleChange: (title: string) => void;
    onUpdateStop: (index: number, field: keyof Stop, value: string) => void;
    onAddStop: () => void;
    onAddSticker: () => void;
    onUploadSticker: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDownload: () => void;
    onShare: () => void;
    onSave: (isPublic: boolean) => void;
    onDelete?: () => void;
    isSaving: boolean;
}

const DateEditor: React.FC<DateEditorProps> = ({
    stops,
    title,
    onTitleChange,
    onUpdateStop,
    onAddStop,
    onAddSticker,
    onUploadSticker,
    onDownload,
    onShare,
    onSave,
    onDelete,
    isSaving,
}) => {
    return (
        <div className="w-full md:w-80 bg-white p-6 rounded-2xl shadow-lg h-fit sticky top-5">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span>📍</span> Date Mapper
            </h2>

            <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Plan Title
                </label>
                <input
                    type="text"
                    placeholder="e.g. The Evening Plan"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-pink-200 transition-colors text-sm font-bold text-gray-700"
                />
            </div>

            <div className="space-y-3 mb-6">
                <button
                    onClick={onAddSticker}
                    className="w-full py-3 px-4 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Add Random Sticker
                </button>

                <div className="relative">
                    <input
                        type="file"
                        id="uploadSticker"
                        accept="image/*"
                        onChange={onUploadSticker}
                        className="hidden"
                    />
                    <label
                        htmlFor="uploadSticker"
                        className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-gray-400"
                    >
                        <Upload size={18} /> Upload Sticker
                    </label>
                </div>
            </div>

            <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {stops.map((stop, i) => (
                    <div key={i} className="animate-fadeIn">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                            {stop.label}
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Time (e.g., 6:00 PM)"
                                value={stop.time}
                                onChange={(e) => onUpdateStop(i, 'time', e.target.value)}
                                className="w-full p-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-200 transition-colors text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Location"
                                value={stop.loc}
                                onChange={(e) => onUpdateStop(i, 'loc', e.target.value)}
                                className="w-full p-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-200 transition-colors text-sm"
                            />
                            <textarea
                                placeholder="Details"
                                rows={2}
                                value={stop.desc}
                                onChange={(e) => onUpdateStop(i, 'desc', e.target.value)}
                                className="w-full p-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-200 transition-colors text-sm resize-none"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 space-y-3 pt-6 border-t border-gray-100">
                <button
                    onClick={onAddStop}
                    className="w-full py-3 px-4 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Add Another Stop
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onSave(false)}
                        disabled={isSaving}
                        className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} /> {isSaving ? '...' : 'Save'}
                    </button>
                    <button
                        onClick={() => onSave(true)}
                        disabled={isSaving}
                        className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Share2 size={18} /> Public
                    </button>
                </div>

                <button
                    onClick={onShare}
                    className="w-full py-3 px-4 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-500 transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2"
                >
                    <Share2 size={18} /> Share Plan
                </button>

                <button
                    onClick={onDownload}
                    className="w-full py-3 px-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2"
                >
                    <Download size={18} /> Download Image
                </button>

                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="w-full py-3 px-4 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        <Trash2 size={18} /> Delete Plan
                    </button>
                )}
            </div>

            <div className="mt-4 text-xs text-gray-400 text-center">
                Tips: drag stickers to move. Double-click to delete.
            </div>
        </div>
    );
};

export default DateEditor;
