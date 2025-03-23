export type Message = {
  type: "success" | "error" | "warning";
  message: string;
};

interface FormMessageProps {
  message: Message | Record<string, never>;
}

export function FormMessage({ message }: FormMessageProps) {
  if (!("type" in message)) return null;

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  return (
    <div className={`px-4 py-3 rounded border ${styles[message.type]}`}>
      <p className="text-sm">{message.message}</p>
    </div>
  );
}
