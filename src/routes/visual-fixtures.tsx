import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

/**
 * Hidden fixture route used by Playwright visual regression. Renders the key
 * UI primitives at known states so light/dark snapshots catch any hardcoded
 * color or shadow that sneaks back in.
 */
function VisualFixtures() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8 text-foreground" data-visual-root>
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <section data-visual="buttons" className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </section>

        <section data-visual="inputs" className="grid max-w-md gap-3">
          <Label htmlFor="vi-input">Email</Label>
          <Input id="vi-input" placeholder="you@example.com" defaultValue="hello@snoopy.dev" />
          <Input placeholder="Empty input" />
          <Textarea placeholder="Tell us more…" defaultValue={"Line one\nLine two"} />
          <div className="flex items-center gap-3">
            <Checkbox id="vi-cb" defaultChecked /> <Label htmlFor="vi-cb">Checked</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="vi-sw" defaultChecked /> <Label htmlFor="vi-sw">Switch on</Label>
          </div>
        </section>

        <section data-visual="cards" className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>Soft-shadow surface using semantic tokens.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </CardContent>
          </Card>
          <Alert>
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>This is an informational alert.</AlertDescription>
          </Alert>
        </section>

        <section data-visual="tabs">
          <Tabs defaultValue="one" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="one">One</TabsTrigger>
              <TabsTrigger value="two">Two</TabsTrigger>
              <TabsTrigger value="three">Three</TabsTrigger>
            </TabsList>
            <TabsContent value="one" className="rounded-lg border p-4">
              Tab one content.
            </TabsContent>
          </Tabs>
        </section>

        <section data-visual="dialog-trigger" className="flex gap-3">
          <Button
            onClick={() =>
              toast("Snapshot toast", { description: "Rendered for visual regression." })
            }
          >
            Show toast
          </Button>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            Open dialog
          </Button>
        </section>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog title</DialogTitle>
              <DialogDescription>Modal surface with overlay backdrop.</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Body copy inside the dialog.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </div>
  );
}

export const Route = createFileRoute("/visual-fixtures")({
  component: VisualFixtures,
  head: () => ({ meta: [{ title: "Visual fixtures" }, { name: "robots", content: "noindex" }] }),
});
