"use client";

import { useState, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type MultiImageUploadProps = {
  mainImage: string;
  images: string[];
  onMainImageChange: (url: string) => void;
  onImagesChange: (urls: string[]) => void;
};

export default function MultiImageUpload({
  mainImage,
  images,
  onMainImageChange,
  onImagesChange,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFullImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${API_URL}${url}`;
  };

  const allImages = mainImage
    ? [mainImage, ...images.filter((img) => img !== mainImage)]
    : [...images];

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError("");
      const fileArray = Array.from(files);

      // Validate
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      for (const file of fileArray) {
        if (!allowedTypes.includes(file.type)) {
          setError("Format non supporte. Utilisez JPG, PNG ou WebP.");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError("Un fichier depasse la taille max de 5MB.");
          return;
        }
      }

      if (allImages.length + fileArray.length > 6) {
        setError("Maximum 6 images par produit.");
        return;
      }

      setUploading(true);

      try {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        fileArray.forEach((file) => formData.append("images", file));

        const res = await fetch(`${API_URL}/api/uploads/products`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Erreur lors de l'upload");
        }

        if (data.success && data.data) {
          const newUrls: string[] = data.data.map((f: { url: string }) => f.url);

          // If no main image yet, set the first uploaded as main
          if (!mainImage && newUrls.length > 0) {
            onMainImageChange(newUrls[0]);
            onImagesChange([...images, ...newUrls]);
          } else {
            onImagesChange([...images, ...newUrls]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
      } finally {
        setUploading(false);
      }
    },
    [mainImage, images, allImages.length, onMainImageChange, onImagesChange]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // --- Drag-and-drop reordering ---
  const handleReorderDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    // Make the drag image semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleReorderDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleReorderDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleReorderDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleReorderDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder allImages
    const reordered = [...allImages];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    // First image becomes main
    const newMain = reordered[0];
    onMainImageChange(newMain);
    onImagesChange(reordered);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // --- Move buttons for mobile ---
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= allImages.length) return;
    const reordered = [...allImages];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const newMain = reordered[0];
    onMainImageChange(newMain);
    onImagesChange(reordered);
  };

  const removeImage = async (url: string) => {
    // Remove from images list
    const newImages = images.filter((img) => img !== url);
    onImagesChange(newImages);

    // If removed image was the main, set next one as main
    if (url === mainImage) {
      onMainImageChange(newImages.length > 0 ? newImages[0] : "");
    }

    // Delete file from server
    if (url.startsWith("/uploads/")) {
      const filename = url.split("/").pop();
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/api/uploads/product/${filename}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Silent fail - file cleanup is not critical
      }
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Image Grid */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allImages.map((url, index) => {
            const isMain = index === 0;
            const isDragOver = dragOverIndex === index && draggedIndex !== index;
            return (
              <div
                key={url + index}
                draggable
                onDragStart={(e) => handleReorderDragStart(e, index)}
                onDragEnd={handleReorderDragEnd}
                onDragOver={(e) => handleReorderDragOver(e, index)}
                onDragLeave={handleReorderDragLeave}
                onDrop={(e) => handleReorderDrop(e, index)}
                className={`relative aspect-square bg-stone-100 rounded-xl overflow-hidden group border-2 cursor-grab active:cursor-grabbing transition-all ${
                  isMain
                    ? "border-amber-500"
                    : isDragOver
                    ? "border-amber-300 scale-105"
                    : "border-transparent"
                } ${draggedIndex === index ? "opacity-50" : ""}`}
              >
                <img
                  src={getFullImageUrl(url)}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                />

                {/* Main badge */}
                {isMain && (
                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Principale
                  </div>
                )}

                {/* Position indicator */}
                <div className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </div>

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {/* Move left */}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index - 1)}
                      className="p-2 bg-white rounded-lg text-stone-700 hover:bg-stone-50 transition-colors"
                      title="Deplacer a gauche"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  {/* Move right */}
                  {index < allImages.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index + 1)}
                      className="p-2 bg-white rounded-lg text-stone-700 hover:bg-stone-50 transition-colors"
                      title="Deplacer a droite"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add more button */}
          {allImages.length < 6 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center gap-2 text-stone-400 hover:border-stone-400 hover:text-stone-500 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="animate-spin w-6 h-6 border-2 border-stone-300 border-t-amber-600 rounded-full" />
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="text-xs">Ajouter</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Empty state - Drop zone */}
      {allImages.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleFileDrag}
          onDragLeave={handleFileDrag}
          onDragOver={handleFileDrag}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-amber-500 bg-amber-50"
              : "border-stone-300 hover:border-stone-400 hover:bg-stone-50"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-10 h-10 border-3 border-stone-200 border-t-amber-600 rounded-full" />
              <p className="text-sm text-stone-600">Upload en cours...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <p className="text-stone-700 font-medium mb-1">
                Cliquez ou glissez vos images ici
              </p>
              <p className="text-sm text-stone-500">
                JPG, PNG ou WebP - Max 5MB par image - Jusqu&apos;a 6 images
              </p>
            </>
          )}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-stone-400">
        {allImages.length}/6 images. Glissez-deposez pour reorganiser.
        L&apos;image en position 1 est l&apos;image principale.
      </p>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
