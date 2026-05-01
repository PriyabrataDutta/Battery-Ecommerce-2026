import { supabase } from "./client";

/**
 * Upload a file to a public bucket and return its public URL.
 * `path` should be unique within the bucket (e.g. include a timestamp + uuid).
 */
export async function uploadToPublicBucket(
  bucket: string,
  path: string,
  file: File,
  options: { contentType?: string; upsert?: boolean } = {},
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: options.contentType ?? file.type,
    upsert: options.upsert ?? false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload to a private bucket and return a short-lived signed URL.
 */
export async function uploadToPrivateBucket(
  bucket: string,
  path: string,
  file: File,
  signedUrlExpiresIn = 60 * 60,
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
  });
  if (error) throw error;
  const { data, error: signedErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, signedUrlExpiresIn);
  if (signedErr) throw signedErr;
  return data.signedUrl;
}

export async function removeFromBucket(bucket: string, paths: string[]): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
}
