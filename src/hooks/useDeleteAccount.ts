import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = async (userId: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      // 1. Delete storage files first (before auth user is deleted)
      const { data: files } = await supabase.storage
        .from("insurance-documents")
        .list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map((file) => `${userId}/${file.name}`);
        await supabase.storage.from("insurance-documents").remove(filePaths);
      }

      // 2. Clear localStorage keys for this user
      localStorage.removeItem(`covered-storage-${userId}`);
      localStorage.removeItem("current_user_id");

      // 3. Call the database function to delete all user data and auth record
      const { error: rpcError } = await supabase.rpc("delete_user_account");

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete account";
      setError(message);
      console.error("Account deletion error:", err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteAccount, isDeleting, error };
}
