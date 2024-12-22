import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUploadCV } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function CVUpload() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const uploadCV = useUploadCV();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      cv: null as File | null
    }
  });

  const onSubmit = async (data: { name: string; email: string; cv: File | null }) => {
    try {
      if (!data.cv) {
        toast({ title: "Please upload your CV", variant: "destructive" });
        return;
      }

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("cv", data.cv);

      const result = await uploadCV.mutateAsync(formData);
      setLocation(`/interview/${result.interviewId}`);
    } catch (error) {
      toast({
        title: "Error uploading CV",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Start Your Interview</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} required />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cv"
              render={({ field: { onChange } }) => (
                <FormItem>
                  <FormLabel>Upload CV (PDF)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => onChange(e.target.files?.[0] || null)}
                      required
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={uploadCV.isPending}>
              {uploadCV.isPending ? "Uploading..." : "Start Interview"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
