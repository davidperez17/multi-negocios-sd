"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";

// Logo o foto del local: vista previa local, "Quitar" y aviso al padre para la vista previa de la landing.
export function ImageField({
  name,
  label,
  help,
  currentUrl,
  shape,
  camera = false,
  onPreviewChange,
}: {
  name: "logo" | "storefront";
  label: string;
  help: string;
  currentUrl: string | null;
  shape: "square" | "wide";
  camera?: boolean;
  onPreviewChange?: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [removed, setRemoved] = useState(false);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  function show(url: string | null) {
    setPreview(url);
    onPreviewChange?.(url);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    setRemoved(false);
    show(objectUrl.current);
  }

  function remove() {
    if (inputRef.current) inputRef.current.value = "";
    setRemoved(true);
    show(null);
  }

  const id = `img-${name}`;
  return (
    <div>
      <p className="text-sm font-medium" id={`${id}-label`}>
        {label}
      </p>
      <p className="mt-0.5 text-sm text-muted">{help}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={name === "logo" ? "Logo actual" : "Foto actual del local"}
            className={`rounded-(--radius-control) border border-border bg-surface ${
              shape === "square" ? "h-16 w-16 object-contain p-1" : "aspect-[16/9] w-40 object-cover"
            }`}
          />
        ) : (
          <span
            aria-hidden
            className={`flex items-center justify-center rounded-(--radius-control) border border-dashed border-border text-muted ${
              shape === "square" ? "h-16 w-16" : "aspect-[16/9] w-40"
            }`}
          >
            <ImagePlus size={20} />
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={id}
            className="inline-flex h-10 items-center gap-2 rounded-(--radius-control) border border-border px-3.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors duration-150 cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
          >
            {camera ? <Camera size={16} aria-hidden /> : <ImagePlus size={16} aria-hidden />}
            {preview ? "Cambiar" : camera ? "Tomar o subir foto" : "Subir logo"}
            <input
              ref={inputRef}
              id={id}
              name={name}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture={camera ? "environment" : undefined}
              onChange={onFile}
              className="sr-only"
            />
          </label>
          {preview && (
            <button
              type="button"
              onClick={remove}
              className="inline-flex h-10 items-center gap-2 rounded-(--radius-control) px-3 text-sm font-medium text-muted hover:text-danger transition-colors duration-150 cursor-pointer"
            >
              <Trash2 size={16} aria-hidden />
              Quitar
            </button>
          )}
        </div>
      </div>
      <input type="hidden" name={name === "logo" ? "removeLogo" : "removeStorefront"} value={removed ? "1" : "0"} />
    </div>
  );
}
