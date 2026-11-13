"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createListingAction,
  type CreateListingState,
  type ListingField,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/lib/data";
import { preparePhoto, UPLOAD_MAX_BYTES } from "@/lib/image";
import { cn } from "@/lib/utils";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function CreateListingForm() {
  const [state, formAction, pending] = useActionState<CreateListingState, FormData>(
    createListingAction,
    {}
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string>();
  // The (possibly resized) photo that will actually be uploaded.
  const [photo, setPhoto] = useState<File | null>(null);
  const [preparing, setPreparing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pickId = useRef(0);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const v = state.values ?? {};
  const err = (field: ListingField) =>
    field === "photo" ? photoError ?? state.errors?.photo : state.errors?.[field];
  const describe = (field: ListingField) =>
    err(field) ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {};

  async function onPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const id = ++pickId.current; // ignore results from an earlier pick
    setPhotoError(undefined);
    setPhoto(null);
    if (!file) return setPreview(null);
    setPreview(URL.createObjectURL(file));
    if (!file.type.startsWith("image/")) return setPhotoError("Choose an image file.");

    setPreparing(true);
    try {
      const ready = await preparePhoto(file);
      if (id !== pickId.current) return;
      if (ready.size > UPLOAD_MAX_BYTES) {
        setPhotoError(
          file.type === "image/gif"
            ? "GIFs must be 4 MB or smaller."
            : "This photo is too large to upload. Try a smaller one."
        );
      } else {
        setPhoto(ready);
      }
    } catch {
      if (id === pickId.current) setPhotoError("Couldn't read this image. Try a JPG or PNG.");
    } finally {
      if (id === pickId.current) setPreparing(false);
    }
  }

  function clearPhoto() {
    pickId.current++;
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
    setPhoto(null);
    setPreparing(false);
    setPhotoError(undefined);
  }

  // Submit via a transition rather than `action={...}`: form actions reset the
  // form afterwards, which would drop the chosen photo when validation fails.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // Upload the resized photo, not the original from the file input.
    if (photo) formData.set("photo", photo, photo.name);
    else formData.delete("photo");
    startTransition(() => formAction(formData));
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8"
    >
      <Card className="self-start gap-3 p-4 shadow-sm ring-foreground/5 sm:p-5">
        <Label htmlFor="photo" className="text-base font-semibold">
          Photo
        </Label>
        <div
          className={cn(
            "relative aspect-square overflow-hidden rounded-xl border-2 border-dashed bg-muted/50 transition-colors focus-within:border-brand hover:border-brand/60 sm:aspect-[4/3]",
            err("photo") && "border-destructive"
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
            <img src={preview} alt="Selected photo preview" className="size-full object-cover" />
          ) : (
            <div className="pointer-events-none flex size-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <ImagePlus className="size-10" />
              <p className="font-medium text-foreground">Add a photo</p>
              <p className="text-sm">
                Tap to choose or take a picture · JPG, PNG, WebP or GIF · large photos are
                resized automatically
              </p>
            </div>
          )}
          <input
            ref={fileRef}
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onPhotoChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            {...describe("photo")}
          />
          {preview && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={clearPhoto}
              aria-label="Remove photo"
              className="absolute top-2 right-2 z-10 rounded-full shadow"
            >
              <X />
            </Button>
          )}
        </div>
        {preparing && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Preparing photo…
          </p>
        )}
        <FieldError id="photo-error" message={err("photo")} />
      </Card>

      <Card className="gap-5 p-4 shadow-sm ring-foreground/5 sm:p-5">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            maxLength={100}
            defaultValue={v.title}
            placeholder="e.g. Vintage road bike"
            className="h-11 text-base md:text-sm"
            {...describe("title")}
          />
          <FieldError id="title-error" message={err("title")} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Price (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="price"
                name="price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                required
                defaultValue={v.price}
                placeholder="0"
                className="h-11 pl-7 text-base md:text-sm"
                {...describe("price")}
              />
            </div>
            <FieldError id="price-error" message={err("price")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              required
              defaultValue={v.category ?? ""}
              className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm"
              {...describe("category")}
            >
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <FieldError id="category-error" message={err("category")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            required
            rows={5}
            maxLength={2000}
            defaultValue={v.description}
            placeholder="Condition, size, pickup details…"
            className="resize-y text-base md:text-sm"
            {...describe("description")}
          />
          <FieldError id="description-error" message={err("description")} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              required
              defaultValue={v.location}
              placeholder="e.g. Palo Alto, CA"
              className="h-11 text-base md:text-sm"
              {...describe("location")}
            />
            <FieldError id="location-error" message={err("location")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Your email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={v.email}
              placeholder="you@example.com"
              className="h-11 text-base md:text-sm"
              {...describe("email")}
            />
            <FieldError id="email-error" message={err("email")} />
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          Your email is shown on the listing so buyers can reach you.
        </p>

        <Button
          type="submit"
          disabled={pending || preparing || !!photoError}
          className="h-11 w-full bg-brand text-base text-brand-foreground hover:bg-brand/90"
        >
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Publishing…" : "Publish listing"}
        </Button>
      </Card>
    </form>
  );
}
