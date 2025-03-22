import { redirect } from "next/navigation";
import type { Message } from "@/components/form-message";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {Message['type']} type - The type of message: 'error', 'success', or 'warning'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export const encodedRedirect = (
  type: Message["type"],
  path: string,
  message: string
) => {
  const searchParams = new URLSearchParams();
  searchParams.set("type", type);
  searchParams.set("message", message);
  return redirect(`${path}?${searchParams.toString()}`);
};
