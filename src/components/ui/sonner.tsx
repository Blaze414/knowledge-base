import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/hooks/use-theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme ?? "system"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-card group-[.toaster]:rounded-brand group-[.toaster]:p-4",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-[color:var(--accent-2)] group-[.toast]:text-white group-[.toast]:rounded-md",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-[color:var(--success)]",
          error: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-destructive",
          info: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-[color:var(--accent-3)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
