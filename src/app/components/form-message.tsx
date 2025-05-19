
interface Message {
  success?: string;
  error?: string;
}

export function FormMessage({ message }: { message: Message | null }) {
  if (!message) return null;

  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <div className="text-green-500 border-l-2 border-green-500 px-4">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="text-red-500 border-l-2 border-red-500 px-4">
          {message.error}
        </div>
      )}
    </div>
  );
}
